new Vue({
    el: "#app",
    data: function() {
        return {
            err: '',
            result: ''
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
        this.result = JSON.stringify(result, null, 2);

        new Noty({
            type: 'info',
            timeout: false,
            text: 'DONE',
            killer: true,
            layout: "bottomRight"
        }).show();

    } catch (err) {
        this.err = err.message ? err.message : err;
        console.error('ERROR','[While running action]',err)
        new Noty({
            type: 'warning',
            timeout: false,
            text: err.substring(0,200),
            killer: true,
            layout: "bottomRight"
        }).show();
    }
}