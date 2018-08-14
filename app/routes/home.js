module.exports = {
    order: 0,
    handler(app) {
        app.get('/', async (req, res) => {
            if (!req.user) {
                return res.redirect('/login')
            }
            if (!req.query.projectId) {
                res.redirect('/projects');
            }
            res.sendView('home', {
                fileTypes: ['javascript', 'function', 'middleware', 'pug', 'route', 'markdown','css'],
                project: await app.fn.mongooseModel('project').findById(req.query.projectId).exec()
            })
        })
    }
}