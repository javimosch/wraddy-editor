new Vue({
    el: "#app",
    data: function() {
        return {
            email: '',
            password: '',
            err: ''
        }
    },
    computed: {

    },
    methods: {
        login,
        resetPassword
    },
    mounted() {
        loadLastEmail(this)
    },
    watch: {

    }
});

function resetPassword() {
    new Noty({
        type: 'warning',
        timeout: false,
        text: 'For the moment this is not automatized. Just contact us through the facebook page.',
        killer: true,
        layout: "bottomRight"
    }).show();
}

function loadLastEmail(vm) {
    let email = window.localStorage.getItem('email')
    if (email) {
        vm.email = email;
    }
}

async function login() {
    try {
        window.localStorage.setItem('email', this.email)
        await httpPost('/login', {
            email: this.email,
            password: this.password
        })
        window.location.href = "/"
    } catch (err) {
        this.err = err.message ? err.message : err;
    }
}