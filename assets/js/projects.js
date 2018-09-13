new Vue({
    name: 'projects',
    el: "#app",
    data: function() {
        return Object.assign({
            tab: 'my_projects',
            nextRefreshInLabel: 'Calculating',
            nextRefreshIn: 1000,
            nextRefreshAt: Date.now() + 1000 * 15,
            timeout: null
        }, window.initialState)
    },
    computed: {

    },
    methods: {
        rowClick,
        stopPropagation,
        updateNextRefreshIn() {
            this.nextRefreshInLabel = 'Next refresh in ' + ((this.nextRefreshAt - Date.now()) / 1000).toFixed(0) + ' Sec.';
            this.nextRefreshIn = this.nextRefreshAt - Date.now()
            if (this.nextRefreshIn <= 100) {
                this.nextRefreshAt = Date.now() + 1000 * 15
                this.pingUrls();
            }
            this.timeout = setTimeout(() => this.updateNextRefreshIn(), 1000)
        },
        pingUrls() {
            this.all_projects.forEach(pr => {
                let dom = Object.keys(pr.domains)
                let lenFail = 0;
                dom.forEach(url => {
                    fetch(url + '/alive').then((r) => {
                        if (r.status === 200) {
                            pr.domains[url] = true
                            pr.enabled = true
                            console.log(url, r.text())
                        } else {
                            pr.domains[url] = false
                            lenFail++
                        }
                    }).catch(err => {
                        pr.domains[url] = false
                        lenFail++
                    })
                })
                if (lenFail == dom.length) {
                    pr.enabled = false
                }
            })
        }
    },
    mounted() {

        window.cancelPing = () => clearTimeout(this.timeout)

        window.onTabsChange = (name) => {
            this.tab = name
        }

        if (this.user.type === 'root') {
            this.updateNextRefreshIn()
            this.pingUrls();
        }
    },
    watch: {

    }
});

function rowClick(projectId) {
    window.location.href = "/?projectId=" + projectId
}

function stopPropagation(event) {
    event.stopPropagation()
}