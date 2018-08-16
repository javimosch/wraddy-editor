new Vue({
    el: "#app",
    data: function() {
        return {
            item: window.initialState.item,
            err: '',
            processing:false
        }
    },
    computed: {
        ableToSave
    },
    methods: {
        save
    },
    mounted() {

    },
    watch: {

    }
});

function ableToSave() {
    if(this.processing){
        return false;
    }
    if(this.item.name.split(' ').length>1){
        this.err='Remove spaces from name'
        return false;
    }else{
        this.err=''
    }
    if(this.item.name&&this.item.name.length>15){
        this.err='The name cannot have more than 15 characters.'
        return false;
    }else{
        this.err=''
    }
    return true;
}

async function save() {
    try {
        this.processing=true
        let r = await httpPost('/rpc/saveOrganization', this.item)
        if(r.err){
            throw new Error(r.err)
        }else{
            $('.sidebarTitle').html(r.name)
        }
        if(!this.item._id){
            window.location.href="/organization/"+r._id
        }
    } catch (err) {
        new Noty({
            type: 'info',
            timeout: 5000,
            text: 'Try later',
            killer: true,
            layout: "bottomRight"
        }).show();
    }
    this.processing=false
}