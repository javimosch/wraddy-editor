new Vue({
    el: "#app",
    data: function() {
        return {
            project: window.project,
            editor: null,
            searchText: '',
            searchResults: [],
            selectedFile: {
                code: ''
            },
            selectedFileIsDirty: false,
            selectedFileOriginal: {},
            headerIsVisible: false,
            treeInit:false
        }
    },
    computed: {
        editorState,

    },
    methods: {
        ableToSaveFile,
        search,
        selectFile,
        fileTypeChange,
        updateFileDirtyState,
        saveSelectedFile,
        toggleHeader,
        newFile,
        mountTree,
        mapDirectoryTreeToJsTreeNode
    },
    async mounted() {
        initEditor(this)
        loadFileFromQueryString(this)
        loadHeaderStateFromLocalStorage(this);
        await this.mountTree()
        window.$(this.$refs.header).fadeIn(true)
    },
    watch: {
        searchText,
        "project.label": limitProjectTitleLength
    }
});

function mapDirectoryTreeToJsTreeNode(item, index) {
    return {
        id: item._id,
        text: item.name,
        data: {
            name: item.name,
        },
        icon: item._type === 'file' ? "far fa-file-word" : undefined,
        state: {
            opened: item.opened ? item.opened : false,
            selected: false
        },
        children: (item.children || []).map((v, i) => this.mapDirectoryTreeToJsTreeNode(v, i))
    }
}

function getAceMode(type) {
    if (['javascript', 'function', 'code', 'rpc', 'route', 'service', 'middleware', 'schema'].includes(type))
        return "ace/mode/javascript"
    else if (['css', 'style', 'scss'].includes(type))
        return "ace/mode/css"
    else if (['pug'].includes(type))
        return "ace/mode/jade"
    else if (['json'].includes(type))
        return "ace/mode/json"
    else if (['html'].includes(type))
        return "ace/mode/html"
    else if (['python'].includes(type))
        return "ace/mode/python"
    else if (['php'].includes(type))
        return "ace/mode/php"
    return ""
}


async function mountTree() {
    let tree = await httpPost('/rpc/getTree', {
        project: this.project._id
    })
    let treeEl = $(this.$refs.tree)
    treeEl.off("changed.jstree").on("changed.jstree", async (e, data) => {
        if (data.action === 'deselect_all') {
            return;
        }
        console.log(data)
        let f = await httpPost('/rpc/getFile', {
            _id: data.node.id
        })
        this.selectFile(f)
    });
    console.log('MOUNTING TREE', this.project)
    if (!this.treeInit) {
        treeEl.jstree({
            'core': {
                'data': [
                    this.mapDirectoryTreeToJsTreeNode(tree)
                ]
            }
        });
        this.treeInit = true
    } else {
        treeEl.jstree(true).settings.core.data = this.mapDirectoryTreeToJsTreeNode(tree);
        treeEl.jstree(true).refresh();
    }
}

function newFile() {
    closeFile(this)
    this.selectedFile = Object.assign(this.selectedFile, {
        _id: 'new'
    })
}

function limitProjectTitleLength(v) {
    if (v.length > 8) this.project.label = this.project.label.substring(0, 7)
}

function formatCodeCommand(vm) {
    return {
        name: 'beautify',
        bindKey: {
            win: 'Ctrl-B',
            mac: 'Command-B'
        },
        exec: function(editor) {
            beautifyAceEditor(editor, vm.selectedFile)
        },
        readOnly: false
    }
}

function loadHeaderStateFromLocalStorage(vm) {
    let state = window.localStorage.getItem('headerIsVisible')
    if (state !== null && state !== undefined) {
        vm.headerIsVisible = state === 'true'
    }
}

function toggleHeader() {
    this.headerIsVisible = !this.headerIsVisible
    window.localStorage.setItem('headerIsVisible', this.headerIsVisible);
}

function ableToSaveFile() {
    return this.selectedFile && this.selectedFile._id && this.selectedFile.name && this.selectedFile.type && this.selectedFileIsDirty && !!this.selectedFile.code
}

function fileTypeChange() {
    this.updateFileDirtyState()
}

function updateFileDirtyState() {
    if (objectDeepCompare(this.selectedFile, this.selectedFileOriginal)) {
        this.selectedFileIsDirty = false;
    } else {
        this.selectedFileIsDirty = true;
    }
}

function loadFileFromQueryString(vm) {
    if (qs('fileId')) {
        vm.selectFile({
            _id: qs('fileId')
        })
    }
}

function closeFile(vm) {
    vm.selectedFile = {}
    vm.editor.setValue('', -1)
    qsRemove('fileId')
}

function closeFileShorcut(vm) {
    return {
        name: 'cancel',
        bindKey: {
            win: 'Alt-Shift-X',
            mac: 'Command-Shift-X'
        },
        exec: (editor) => {
            closeFile(vm)
        },
        readOnly: false
    };
}

function editorState() {
    if (this.selectedFile && this.selectedFile._id) {
        this.updateFileDirtyState()
        if (this.selectedFileIsDirty) {
            return 'Edition*'
        } else {
            return 'Edition&nbsp;'
        }
    } else {
        return 'Creation'
    }
}

async function saveSelectedFile() {
    try {
        let newFile = await httpPost('/saveFile', {
            project: this.project._id,
            file: this.selectedFile
        })
        this.selectedFile._id = newFile._id
        this.selectedFileOriginal = Object.assign({}, this.selectedFile)
        this.updateFileDirtyState()
        this.mountTree()
    } catch (err) {
        console.warn(err);
        new Noty({
            type: 'info',
            timeout: 5000,
            text: 'Try later',
            killer: true,
            layout: "bottomRight"
        }).show();
    }
}

async function selectFile(file) {
    let single = await httpPost('/getFile', {
        _id: file._id
    })
    this.selectedFile = single
    this.editor.setValue(this.selectedFile.code, -1);
    console.log('selectFile', file._id, single)
    this.searchText = '';
    this.searchResults = []
    this.selectedFileOriginal = Object.assign({}, this.selectedFile)
    this.editor.session.setMode(getAceMode(single.type));
    qs('fileId', single._id)
}

function searchText(v) {
    if (v.toString().length > 4) {
        this.search();
    }
}

async function search() {
    let data = await httpPost('/search', {
        text: this.searchText,
        project: this.project._id
    })
    this.searchResults = data
    console.log('search', this.searchText, data)
}

function initEditor(vm) {
    let editor = vm.editor = self.editor = ace.edit("CodeEditor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode('ace/mode/javascript');
    editor.session.setOptions({
        wrap: true,
        tabSize: 4,
        useSoftTabs: false
    });
    editor.on("change", data => {
        vm.selectedFile.code = editor.getValue()
        vm.updateFileDirtyState()
        vm.$forceUpdate()
    })
    editor.commands.addCommand(closeFileShorcut(vm));
    editor.commands.addCommand(formatCodeCommand(vm));

}