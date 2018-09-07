new Vue({
    el: "#app",
    data: function() {
        return {
            server: window.server,
            user: window.user,
            pr: window.project,
            project: window.project,
            err: '',
            processing: false
        }
    },
    computed: {
        ableToSave,
        defaultDomainMessage
    },
    methods: {
        save,
        setup,
        sync,
        open
    },
    mounted() {

    },
    watch: {

    }
});


function defaultDomainMessage() {
    let domain = this.project.label.toLowerCase().replace(/[^\w\s]/gi, '').split('_').join('')
    return `Your project is also available at ${domain}.wrapkend.com`
}

async function open() {
    try {
        window.open(`http://${this.server.WRAPKEND_IP}:${this.project.settings.envs[this.server.NODE_ENV].PORT}/`)
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
        this.processing = true
        let r = await httpPost('/saveProject', this.pr)
        if (r.err) {
            throw new Error(r.err)
        }
        if (!this.pr._id) {
            window.location.href = "/projects"
        }
    } catch (err) {
        this.err = err.message ? err.message : err
    }
    this.processing = false
}