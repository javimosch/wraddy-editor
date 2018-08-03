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
        login
    },
    mounted() {
        loadLastEmail(this)
    },
    watch: {

    }
});

function loadLastEmail(vm){
    let email = window.localStorage.getItem('email')
    if(email){
        vm.email= email;
    }
}

async function login() {
    try {
        window.localStorage.setItem('email', this.email)
        await httpPost('/login', { email: this.email, password: this.password })
        window.location.href="/"
    } catch (err) {
        this.err = err.message ? err.message : err;
    }
}