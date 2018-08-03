

new Vue({
    el: "#app",
    data: function() {
        return {
            project: window.project,
            editor: null,
            searchText: '',
            searchResults: [],
            selectedFile: {},
            selectedFileIsDirty: false,
            selectedFileOriginal: {},
            headerIsVisible: false
        }
    },
    computed: {
        editorState,
        ableToSaveFile
    },
    methods: {
        search,
        selectFile,
        fileTypeChange,
        updateFileDirtyState,
        saveSelectedFile,
        toggleHeader
    },
    mounted() {
        initEditor(this)
        loadFileFromQueryString(this)
        loadHeaderStateFromLocalStorage(this);

        window.$(this.$refs.header).fadeIn(true)
    },
    watch: {
        searchText,
        "project.label": limitProjectTitleLength
    }
});

function limitProjectTitleLength(v){
    if(v.length>8) this.project.label = this.project.label.substring(0,7)
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
    return this.selectedFile && this.selectedFile._id && this.selectedFile.name && this.selectedFile.type && this.selectedFileIsDirty
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

function closeFileShorcut(vm) {
    return {
        name: 'cancel',
        bindKey: {
            win: 'Alt-Shift-X',
            mac: 'Command-Shift-X'
        },
        exec: (editor) => {
            vm.selectedFile = {}
            editor.setValue('', -1)
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
    await httpPost('/saveFile', this.selectedFile)
    this.selectedFileOriginal = Object.assign({}, this.selectedFile)
    this.updateFileDirtyState()
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
    qs('fileId', single._id)
}

function searchText(v) {
    if (v.toString().length > 4) {
        this.search();
    }
}

async function search() {
    let data = await httpPost('/search', {
        text: this.searchText
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
    })
    editor.commands.addCommand(closeFileShorcut(vm));
    editor.commands.addCommand(formatCodeCommand(vm));
    
}