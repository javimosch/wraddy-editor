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
        canRegister
    },
    methods: {
        register
    },
    mounted() {
    },
    watch: {

    }
});

function canRegister(){
    return !!this.email && !!this.password
}

async function register() {
    try {
        window.localStorage.setItem('email', this.email)
        await httpPost('/register', { email: this.email, password: this.password })
        window.location.href="/"
    } catch (err) {
        this.err = err.message ? err.message : err;
    }
}