

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
            envs: '',
            state: 'Needs setup',
            tab: 'general',
            newUserEmail: '',
            newUserRole: 'developer'
        }
    },
    computed: {
        kickUserLabel,
        ableToKickUser,
        addUserLabel,
        ableToSave,
        defaultDomainMessage,
        canAddUser,
        itHasPORT,
        port,
        alternativePortMessage
    },
    methods: {
        kickUser,
        selectUser,
        getUrl,
        resolveEnvs,
        prepareEnvs,
        save,
        setup,
        sync,
        open,
        remove,
        checkState,
        addUser
    },
    mounted() {
        onTabsChangeCreate(this)
        this.resolveEnvs()
        if(this.project._id){
            this.checkState()
        }else{
            this.state = 'Creation'
        }
    },
    watch: {

    }
});

function alternativePortMessage(){
    return `If you are unable to view the public domain after several minutes, contact us. In the meanwhile you can use <a href="http://178.128.254.49:`+this.port+`/" target="_blank">this link.<a/>`
}
function addUserLabel() {
    if (this.newUserEmail) {
        let match = this.project.users.find(u => u.email == this.newUserEmail)
        if (match && this.project.usersRights[match._id] != this.newUserRole) {
            return 'Update'
        }
    }
    return 'Add'
}

function selectUser(user) {
    this.newUserEmail = user.email
    this.newUserRole = this.project.usersRights[user._id]
}

async function kickUser() {
    return await saveProjectUser.apply(this, [{
        kick: true
    }])
}

async function addUser() {
    return await saveProjectUser.apply(this, [])
}

async function remove(){
    if(window.confirm('Sure ?')){
        let done = await httpPost('/rpc/removeProject', {
            projectId: this.project._id
        });
        if(done){
            window.location.href="/projects";
        }
    }
}

async function saveProjectUser(data = {}) {
    try {
        let user = await httpPost('/rpc/addUserToProject', Object.assign(data, {
            email: this.newUserEmail,
            role: this.newUserRole,
            project: this.project._id
        }))

        if (data.kick) {
            this.project.users.forEach((u, i) => {
                if (u.email == this.newUserEmail) {
                    this.project.users.splice(i, 1)
                    delete this.project.usersRights[u._id]
                }
            })
        } else {
            if (!this.project.users.find(u => u._id == user._id)) {
                this.project.users.push(user)
            }
            this.project.usersRights[user._id] = this.newUserRole
        }
        this.newUserEmail = ''
        console.log('DEBUG', '[after adding user]', user)
    } catch (err) {
        var text = 'It was not possible to add the user. Contact us!'
        let match = Object.keys(this.server.ERRORS).find(k => err.indexOf(k) !== -1)
        if (match) {
            text = this.server.ERRORS[match]
            console.warn('ERROR [controlled]', err)
        } else {
            console.error('ERROR', '[when adding user]', err)
        }
        new Noty({
            type: 'warning',
            timeout: false,
            text,
            killer: true,
            layout: "bottomRight"
        }).show();
    }
}

function kickUserLabel() {
    if (this.project.users.find(u => u._id == this.user._id && this.newUserEmail == u.email)) {
        return 'Leave project'
    } else {
        return 'Kick'
    }
}

function ableToKickUser() {
    //there is a valid selection
    let target = this.project.users.find(u => u.email == this.newUserEmail)

    if (!target) return false;

    //current user is owner
    let isCurrentUserOwner = this.project.users.find(u => u._id == this.user._id && this.project.usersRights[u._id] === 'owner')
    if (isCurrentUserOwner) {

        //target is owner and there is only one owner? restrict
        let thereIsOnlyOneOwner = Object.keys(this.project.usersRights).filter(k => this.project.usersRights[k] === 'owner').length <= 1;
        let targetIsOwner = target && this.project.usersRights[target._id] === 'owner'
        if (targetIsOwner && thereIsOnlyOneOwner) {
            return false;
        }

        //if target is a different owner, restrict (owners can't be kicked)
        if (targetIsOwner && this.user.email != target.email) {
            return false;
        }

        return true;
    }
    return false;
}

function canAddUser() {
    if (!!this.newUserEmail && !!this.newUserRole) {
        let match = this.project.users.find(u => u.email == this.newUserEmail)
        if (match && this.project.usersRights[match._id] == this.newUserRole) {
            return false
        }
    }
    return !!this.newUserEmail && !!this.newUserRole
}

function checkState() {

    if(!itHasPORT.apply(this,[])){
        return console.warn('WARN [skip state check, setup needed]')
    }

    let url = this.getUrl()
    if (url.charAt(url.length - 1) !== '/') url += '/'
    url += 'alive'
    fetch(url).then(res => {
        this.state = res && res.status === 200 ? 'Active' : 'Needs setup'
    })
}

function resolveEnvs() {
    try {
        let envs = this.project.settings.envs[this.server.NODE_ENV]
        this.envs = Object.keys(envs).filter(k => !['NODE_ENV', 'PORT'].includes(k)).map(k => `${k}=${envs[k]}`).join(`
`).trim()
    } catch (err) {

    }
}

function prepareEnvs() {
    let hasError = false
    this.envs.split(/\r\n|\r|\n/g).forEach(line => {
        let env = line.trim().split('=')
        try {
            this.project.settings.envs[this.server.NODE_ENV] = this.project.settings.envs[this.server.NODE_ENV] || {}
            this.project.settings.envs[this.server.NODE_ENV][env[0]] = env[1]
            console.log('DEBUG', '[Env set]', env.join(' -> '))
        } catch (err) {
            hasError = true
            console.warn('WARN', '[When setup envs]', err.stack)
        }
    })
    if (hasError) {
        new Noty({
            type: 'warning',
            timeout: false,
            text: 'Fail to setup enviromental variables. Contact us!',
            killer: true,
            layout: "bottomRight"
        }).show();
    }
}

function onTabsChangeCreate(vm) {
    window.onTabsChange = function(name) {
        vm.tab = name
    }
}

function defaultDomainMessage() {
    let domain = (this.project.label || '').toLowerCase().replace(/[^\w\s]/gi, '').split('_').join('')
    return `Your project is also available at ${domain}.wrapkend.com`
}

function port(){
    try{
        return this.project.settings.envs[this.server.NODE_ENV].PORT
    }catch(err){
        return "";
    }
}
function itHasPORT(){
    try{
        let a = this.project.settings.envs[this.server.NODE_ENV].PORT
        return true;
    }catch(err){
        return false;
    }
}

function getUrl() {
    this.project.settings.envs[this.server.NODE_ENV] = this.project.settings.envs[this.server.NODE_ENV]||{}
    let defaultDomain = this.project.label ? this.project.label.toLowerCase().replace(/[^\w\s]/gi, '').split('_').join('').split('.').join('') + '.wrapkend.com' : ''
    let rawIp = `http://${this.server.WRAPKEND_IP}:${this.project.settings.envs[this.server.NODE_ENV].PORT}/`;
    let ip = defaultDomain ? defaultDomain : rawIp
    return 'https://' + ip.split('https://').join('https://');
}

async function open() {
    try {
        let defaultDomain = this.project.label ? this.project.label.toLowerCase().replace(/[^\w\s]/gi, '').split('_').join('').split('.').join('') + '.wrapkend.com' : ''
        let rawIp = `http://${this.server.WRAPKEND_IP}:${this.project.settings.envs[this.server.NODE_ENV].PORT}/`;
        let ip = defaultDomain ? defaultDomain : rawIp
        window.open('https://' + ip.split('https://').join('https://'))
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
            text: 'Setup and Sync Success at port ' + result.port,
            killer: true,
            layout: "bottomRight"
        }).show();

        setTimeout(() => this.checkState(), 5000)

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
    if (this.pr.label && this.pr.label.length > 15) {
        this.err = 'The label cannot have more than 15 characters.'
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
                text: 'The label "' + this.project.label + '" is alredy in use',
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