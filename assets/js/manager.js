new Vue({
    el: "#app",
    data: function() {
        return {
            params: '',
            err: '',
            result: {}
        }
    },
    computed: {

    },
    filters: {
        pretty: function(value) {
            try{
                return JSON.stringify(JSON.parse(value), null, 2);
            }catch(err){
                return 'Invalid JSON'
            }
        }
    },
    methods: {
        runAction,
        runFunction
    },
    mounted() {
        //loadLastEmail(this)
    },
    watch: {

    }
});


async function runFunction(name) {
    try {
        name = name.split('.js').join('');
        var result = await httpPost('/rpc/' + name, {
            $params: this.params.split(',').map(p => {
                p = p.trim();
                if (p === '$user') {
                    p = user;
                }
                if (p === 'true') p = true;
                if (p === 'false') p = false;
                if (!isNaN(parseFloat(p))) {
                    p = parseFloat(p);
                }
                return p;
            })
        })
        this.result = JSON.stringify(result, null, 2);
        this.err = ''
        console.log(this.result);

        new Noty({
            type: 'info',
            timeout: false,
            text: 'DONE',
            killer: true,
            layout: "bottomRight"
        }).show();

    } catch (err) {
        this.err = err.message ? err.message : err;
        console.error('ERROR', '[While running action]', err)
        new Noty({
            type: 'warning',
            timeout: false,
            text: err.substring(0, 200),
            killer: true,
            layout: "bottomRight"
        }).show();
    }
}

async function runAction(name) {
    try {
        var result = await httpPost('/managerActions', {
            name
        })
        this.result = JSON.stringify(result, null, 2);
        this.err = ''
        new Noty({
            type: 'info',
            timeout: false,
            text: 'DONE',
            killer: true,
            layout: "bottomRight"
        }).show();

    } catch (err) {
        this.err = err.message ? err.message : err;
        console.error('ERROR', '[While running action]', err)
        new Noty({
            type: 'warning',
            timeout: false,
            text: err.substring(0, 200),
            killer: true,
            layout: "bottomRight"
        }).show();
    }
}