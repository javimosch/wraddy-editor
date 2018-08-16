module.exports = app => {
    app.get('/account', async (req, res) => {
        if (!req.user) {
            return res.redirect('/login')
        }
        res.sendView('account', {
            sidebarActiveLink: 'account',
            maxProjects: req.user.type === 'root' ? 'unlimited' : 1,
            maxOrganizations: req.user.type === 'root' ? 'unlimited' : 1,
            projects: req.user.projects && req.user.projects.length || 0,
            organizations: req.user.organizations ,
            _initialState:['organizations','organization']
        })
    })
}