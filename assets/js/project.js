new Vue({
    el: "#app",
    data: function() {
        return {
            pr: window.project,
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
    if(this.pr.shortText&&this.pr.shortText.length>25){
        this.err='The Brief description cannot have more than twenty-five characters.'
        return false;
    }else{
        this.err=''
    }
    if(this.pr.label&&this.pr.label.length>8){
        this.err='The label cannot have more than eight characters.'
        return false;
    }else{
        this.err=''
    }
    return this.pr.name
}

async function save() {
    try {
        this.processing=true
        let r = await httpPost('/saveProject', this.pr)
        if(r.err){
            throw new Error(r.err)
        }
        if(!this.pr._id){
            window.location.href="/projects"
        }
    } catch (err) {
        this.err = err.message ? err.message : err
    }
    this.processing=false
}