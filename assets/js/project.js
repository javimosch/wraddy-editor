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
        ableToSave
    },
    methods: {
        save,
        setup,
        sync
    },
    mounted() {

    },
    watch: {

    }
});

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
            method: 'get'
        })
        Noty.closeAll();
    } catch (err) {
        console.error(err)

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
        let url = this.server.WRAPKEND_API + 
        let result = await httpPost('/redirect-to-manager', {
            url:'/configure-project/' + this.project._id + '?userId=' + this.user._id + '&forceRecreate=1',
            method:'get'
        }, {
            withCredentials: false,
            method: 'get'
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