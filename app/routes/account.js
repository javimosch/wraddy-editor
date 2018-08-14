module.exports = app => {
    app.get('/account', (req, res) => {
        if (!req.user) {
            return res.redirect('/login')
        }
        res.sendView('account', {
            maxProjects: req.user.type === 'root' ? 'unlimited' : 1,
            maxOrganizations: req.user.type === 'root' ? 'unlimited' : 1,
            projects: req.user.projects && req.user.projects.length || 0,
            organizations: req.user.organizations && req.user.organizations.length || 0
        })
    })
}