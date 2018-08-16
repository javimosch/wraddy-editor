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
        runAction
    },
    mounted() {
        //loadLastEmail(this)
    },
    watch: {

    }
});

async function runAction(name) {
    try {
        var result = await httpPost('/managerActions', {
            name
        })
        this.result = JSON.stringify(result,null,2);
    } catch (err) {
        this.err = err.message ? err.message : err;
    }
}