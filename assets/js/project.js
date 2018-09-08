new Vue({
    el: "#app",
    data: function() {
        return {
            server: window.server,
            user: window.user,
            pr: window.project,
            project: window.project,
            err: '',
            processing: false,
            envs:''
        }
    },
    computed: {
        ableToSave,
        defaultDomainMessage
    },
    methods: {
        resolveEnvs,
        prepareEnvs,
        save,
        setup,
        sync,
        open
    },
    mounted() {
        this.resolveEnvs()
    },
    watch: {

    }
});

function resolveEnvs(){
    try{
        let envs = this.project.settings.envs[this.server.NODE_ENV]
        this.envs = Object.keys(envs).filter(k=>!['NODE_ENV','PORT'].includes(k)).map(k=>`${k}=${envs[k]}`).join(`
`).trim()
    }catch(err){

    }
}

function prepareEnvs(){
    let hasError = false
    this.envs.split(/\r\n|\r|\n/g).forEach(line=>{
        let env = line.trim().split('=')
        try{
            this.project.settings.envs[this.server.NODE_ENV][env[0]]= env[1]
            console.log('DEBUG','[Env set]',env.join(' -> '))
        }catch(err){
            hasError=true
            console.warn('WARN','[When setup envs]',err.stack)
        }
    })
    if(hasError){
        new Noty({
            type: 'warning',
            timeout: false,
            text: 'Fail to setup enviromental variables. Contact us!',
            killer: true,
            layout: "bottomRight"
        }).show();
    }
}

function defaultDomainMessage() {
    let domain = (this.project.label||'').toLowerCase().replace(/[^\w\s]/gi, '').split('_').join('')
    return `Your project is also available at ${domain}.wrapkend.com`
}

async function open() {
    try {
        let defaultDomain = this.project.label ? this.project.label.toLowerCase().replace(/[^\w\s]/gi, '').split('_').join('').split('.').join('') + '.wrapkend.com' : ''
        let rawIp = `http://${this.server.WRAPKEND_IP}:${this.project.settings.envs[this.server.NODE_ENV].PORT}/`;
        let ip = defaultDomain ? defaultDomain : rawIp
        window.open('https://'+ip.split('https://').join('https://'))
    } catch (err) {
        console.error('ERROR', '[When opening project in browser]', err.stack, this.project)
        new Noty({
            type: 'warning',
            timeout: false,
            text: 'Unable to open. Contact us!',
            killer: true,
            layout: "bottomRight"
        }).show();
    }
}

async function sync() {
    try {
        new Noty({
            type: 'info',
            timeout: false,
            text: 'Sync in progress...',
            killer: true,
            layout: "bottomRight"
        }).show();
        await httpPost('/redirect-to-manager', {
            url: '/sync-project-files/' + this.project._id + '?userId=' + this.user._id + '&forceRecreate=1',
            method: 'get'
        }, {
            withCredentials: false,
            //method: 'get'
        })
        new Noty({
            type: 'info',
            timeout: false,
            text: 'Sync success',
            killer: true,
            layout: "bottomRight"
        }).show();
    } catch (err) {
        console.error('ERROR', '[When sync in progress]', err.stack)
        new Noty({
            type: 'warning',
            timeout: false,
            text: 'Unable to sync. Contact us!',
            killer: true,
            layout: "bottomRight"
        }).show();
    }
}

async function setup() {
    try {
        new Noty({
            type: 'info',
            timeout: false,
            text: 'Setup in progress...',
            killer: true,
            layout: "bottomRight"
        }).show();
        let result = await httpPost('/redirect-to-manager', {
            url: '/configure-project/' + this.project._id + '?userId=' + this.user._id + '&forceRecreate=1',
            method: 'get'
        }, {
            withCredentials: false,
            //method: 'get'
        })
        try {
            this.project.settings.envs[this.server.NODE_ENV].PORT = result.port
        } catch (err) {}
        new Noty({
            type: 'info',
            timeout: false,
            text: 'Configured OK at port ' + result.port,
            killer: true,
            layout: "bottomRight"
        }).show();
    } catch (err) {
        console.error('ERROR', '[When setup in progress]', err)
        new Noty({
            type: 'warning',
            timeout: false,
            text: 'Unable to configure. Contact us!',
            killer: true,
            layout: "bottomRight"
        }).show();
    }
}

function ableToSave() {
    if (this.processing) {
        return false;
    }
    if (this.pr.shortText && this.pr.shortText.length > 25) {
        this.err = 'The Brief description cannot have more than twenty-five characters.'
        return false;
    } else {
        this.err = ''
    }
    if (this.pr.label && this.pr.label.length > 8) {
        this.err = 'The label cannot have more than eight characters.'
        return false;
    } else {
        this.err = ''
    }
    return this.pr.name
}

async function save() {
    try {

        this.prepareEnvs()

        this.processing = true
        let r = await httpPost('/saveProject', this.pr)
        console.log('DEBUG', '[after save]', r)
        if (r.err) {
            throw new Error(r.err)
        }
        if (!this.pr._id) {
            window.location.href = "/projects"
        }
    } catch (err) {
        console.error('ERROR', '[when saving]', err)
        err = this.err = err.message ? err.message : err

        if (err.indexOf('LABEL_TAKEN') !== -1) {
            new Noty({
                type: 'warning',
                timeout: false,
                text: 'The label "'+this.project.label+'" is alredy in use',
                killer: true,
                layout: "bottomRight"
            }).show();
        }

        if (err.indexOf('LABEL_REQUIRED') !== -1) {
            new Noty({
                type: 'warning',
                timeout: false,
                text: 'The public name is required',
                killer: true,
                layout: "bottomRight"
            }).show();
        }

        if (err.indexOf('PROJECTS_LIMIT') !== -1) {
            new Noty({
                type: 'warning',
                timeout: false,
                text: 'You reach your plan limit (Contact us to upgrade!)',
                killer: true,
                layout: "bottomRight"
            }).show();
        }


    }
    this.processing = false
}