new Vue({
    el: "#app",
    data: function() {
        return {
            
        }
    },
    computed: {
        
    },
    methods: {
        rowClick,
        stopPropagation
    },
    mounted() {

    },
    watch: {

    }
});

function rowClick(projectId){
    window.location.href="/?projectId="+projectId
}
function stopPropagation(event){
    event.stopPropagation()
}