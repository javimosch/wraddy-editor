new Vue({
    name: 'plugins',
    el: "#app",
    data: function() {
        return Object.assign({
            browseFilter:''
        }, window.initialState)
    },
    computed: {

    },
    methods: {
        selectProject
    },
    mounted() {
        window.onTabsChange = (name) => {
            this.tab = name
        }

    },
    watch: {

    }
});



function selectProject() {
    new Noty({
        type: 'info',
        timeout: false,
        text: 'Project selected',
        killer: true,
        layout: "bottomRight"
    }).show();
}