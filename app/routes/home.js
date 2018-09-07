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

            app.srv.projectSockets.markAsAlive(req.query.projectId)

            res.sendView('home', {
                initialState:{
                    NODE_ENV: process.env.NODE_ENV
                },
                server: app.srv.constants,
                fileTypes: app.srv.constants.fileTypes,
                project: await app.fn.mongooseModel('project').findById(req.query.projectId).exec()
            })
        })
    }
}