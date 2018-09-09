//import './editor_console.js'

new Vue({
    el: "#app",
    data: function() {
        return Object.assign(window.initialState || {}, {
            socket: null,
            user: window.user,
            server: window.server,
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
            treeInit: false,
            errors: [],
            recentFiles: [],
            consoleLogs: [],
            consoleShow: false,
            consoleType: ''
        })
    },
    computed: {
        consoleBody,
        editorState,
        errorsLabel
    },
    methods: {
        clearConsole,
        viewProject,
        viewConsole,
        ableToSaveFile,
        search,
        selectFile,
        fileTypeChange,
        updateFileDirtyState,
        saveSelectedFile,
        toggleHeader,
        newFile,
        mountTree,
        mapDirectoryTreeToJsTreeNode,
        openRecentFile,
        viewErrors,
        addRecentFile,
        recentFileLabel,
        timeDifference,
        initializateSocket
    },
    async mounted() {
        initEditor(this)
        loadFileFromQueryString(this)
        loadHeaderStateFromLocalStorage(this);
        await this.mountTree()
        window.$(this.$refs.header).fadeIn(true)
        this.initializateSocket(this)
        delete window.user

        $(document).on('keyup', (e) => {
            if (e.keyCode === 27) {
                if (this.consoleShow) {
                    this.consoleShow = false
                }
            }
        });
    },
    watch: {
        searchText,
        "project.label": limitProjectTitleLength
    }
});

function clearConsole(){
    this.consoleLogs = []
}

function consoleBody() {
    if (!this.consoleType) {
        return this.consoleLogs.map(d => d.m).join('&#13;&#10;')
    } else {
        return this.consoleLogs.filter(d => d.type == this.consoleType).map(d => d.m).join('&#13;&#10;')
    }
}

function initializateSocket(vm) {
    //let url = vm.NODE_ENV === 'production' ? 'http://178.128.254.49:8084/errors' : 'localhost:8084/errors'
    let url = '/' + vm.project.name + '/errors'
    console.log('Targeting editor io at ', url)
    vm.socket = io(url);
    vm.socket.on('connect', function() {
        console.log('DEBUG', '[After connection to socket success]')
    });
    vm.socket.on('projectLog', (data) => {
        data.message = data.message.split(/\r\n|\r|\n/g)[0]
        if (data.message.indexOf(data.type) === -1) {
            return
        }

        this.consoleLogs.push({
            m: getFormattedLog(data),
            type: data.type
        })
        console.info(getFormattedLog(data))
    })
}

function getFormattedLog(data) {
    if (data.message.indexOf(data.type) !== 0) {
        return data.t + ' ' + (data.type + data.message.split(data.type)[1]).trim()
    } else {
        return data.t + ' ' + data.message.trim()
    }
}

function viewConsole() {
    this.consoleShow = true
}

function viewErrors() {
    this.selectFile({
        _id: 'local',
        readonly: true,
        name: "ERRORS",
        code: 'ASD',
        type: 'log'
    })
}

function openRecentFile(item) {
    this.selectFile(item)
}

function addRecentFile(file) {
    let f = Object.assign({}, file)
    f.modified = Date.now()
    let match = this.recentFiles.find(rf => rf._id == f._id)
    if (match) {
        Object.assign(match, f)
    } else {
        this.recentFiles.push(f)
    }
    this.recentFiles = this.recentFiles.sort((a, b) => {
        return a.modified < b.modified ? 1 : -1
    })
}

function timeDifference(before) {
    return window.timeDifference(Date.now(), before)
}

function recentFileLabel(item) {
    return `<span>${item.name}</span> <span class="type ml-2">(${item.type})</span>`
}

function errorsLabel() {
    return `Errors ${this.errors.length>0?`(${this.errors.length})`:``}`
}

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

function saveFileCommand(vm) {
    return {
        name: 'saveFile',
        bindKey: {
            win: 'Alt-S',
            mac: 'Command-S'
        },
        exec: function(editor) {
            vm.saveSelectedFile()
            window.event.stopPropagation()
        },
        readOnly: false
    }
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
        //vm.headerIsVisible = state === 'true'
        vm.headerIsVisible = true
    }
}

function toggleHeader() {
    this.headerIsVisible = !this.headerIsVisible
    window.localStorage.setItem('headerIsVisible', this.headerIsVisible);
}

async function viewProject() {
    try {
        let defaultDomain = this.project.label ? this.project.label.toLowerCase().replace(/[^\w\s]/gi, '').split('_').join('').split('.').join('') + '.wrapkend.com' : ''
        let rawIp = `http://${this.server.WRAPKEND_IP}:${this.project.settings.envs[this.NODE_ENV].PORT}/`;
        let ip = defaultDomain ? defaultDomain : rawIp
        window.open('https://' + ip.split('https://').join('https://'))
    } catch (err) {
        console.log('ERROR', '[When opening project]', this.project.settings, err.stack)
        new Noty({
            type: 'warning',
            timeout: false,
            text: 'Configuration needed (From settings)',
            killer: true,
            layout: "bottomRight"
        }).show();
    }
}
/*
async function runProject() {
    try {
        new Noty({
            type: 'info',
            timeout: false,
            text: 'Setup in progress...',
            killer: true,
            layout: "bottomRight"
        }).show();
        console.info(url)
        let url = '/configure-project/' + this.project._id + '?userId=' + this.user._id +'&forceRecreate=1';
        let result = await httpPost('/redirect-to-manager', {
            url,
            method:'get',
            params:{}
        }, {
            withCredentials: false,
            method:'get'
        })
        window.open(`http://${this.server.WRAPKEND_IP}:${result.port}/`)
        console.info(result)
        Noty.closeAll();
    } catch (err) {
        console.error(err)

        new Noty({
            type: 'warning',
            timeout: false,
            text: 'Unable to configure. Contact us!',
            killer: true,
            layout: "bottomRight"
        }).show();
    }
}*/

function ableToSaveFile() {
    if (this.selectedFile && this.selectedFile.readonly === true) {
        return false;
    }
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
    if (qs('fileId') && qs('fileId') != 'local') {
        vm.selectFile({
            _id: qs('fileId')
        })
    } else {
        qsRemove('fileId')
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
        /*
        this.socket.emit('saveFile',{
            project:{
                name: this.project.name,
                privateKey: this.project.privateKey
            },file:{
                _id: this.selectedFile._id,
                name: this.selectedFile.name,
                code: this.selectedFile.code,
                type: this.selectedFile.type,
            }
        })*/
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
    var single
    if (file._id === 'local') {
        single = file;
    } else {
        single = await httpPost('/getFile', {
            _id: file._id
        })
    }

    this.selectedFile = single
    this.editor.setValue(this.selectedFile.code, -1);
    console.log('selectFile', file._id, single)
    this.searchText = '';
    this.searchResults = []
    this.selectedFileOriginal = Object.assign({}, this.selectedFile)
    this.editor.session.setMode(getAceMode(single.type));
    qs('fileId', single._id)
    this.addRecentFile(this.selectedFile)
}

function searchText(v) {
    if (v.toString().length > 4) {
        this.search();
    }
}

async function search() {
    let data = await httpPost('/search', {
        text: this.searchText,
        //project: this.project._id
    })
    this.searchResults = data
    console.log('search', this.searchText, data)
}

function initEditor(vm) {
    let editor = vm.editor = self.editor = ace.edit("CodeEditor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode('ace/mode/javascript');
    editor.session.setOptions({
        showInvisibles: true,
        highlightActiveLine: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
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
    editor.commands.addCommand(saveFileCommand(vm));

}