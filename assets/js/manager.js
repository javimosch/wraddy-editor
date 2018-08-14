new Vue({
    el: "#app",
    data: function() {
        return {
            err: '',
            result:''
        }
    },
    computed: {
        
    },
    methods: {
        runRpc
    },
    mounted() {
        loadLastEmail(this)
    },
    watch: {

    }
});

async function runRpc(name) {
    try {
        var result = await httpPost('/runRpc', {
            name
        })
        this.result = JSON.stringify(result,null,2);
    } catch (err) {
        this.err = err.message ? err.message : err;
    }
}