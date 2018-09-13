new Vue({
    name: 'plugin',
    el: "#app",
    data: function() {
        return Object.assign({}, window.initialState)
    },
    computed: {

    },
    methods: {
        save
    },
    mounted() {
        window.onTabsChange = (name) => {
            this.tab = name
        }
    },
    watch: {
    }
});

async function save() {
    if (!this.item.name) {
        return showWarn('Name required')
    }
    let r = await httpPost('/plugin', this.item)
    this.item._id = r._id
    this.$forceUpdate()
    return showInfo('Saved',500)
}