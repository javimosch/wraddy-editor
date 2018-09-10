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
            let project = await app.fn.mongooseModel('project').findById(req.query.projectId).exec()
            
            app.srv.editorIO.prepareErrorIo(project.name)

            res.sendView('home', {
                initialState:{
                    NODE_ENV: process.env.NODE_ENV
                },
                server: Object.assign(app.srv.constants,{
                    consoleTemplate: require('btoa')(app.fn.compileFileWithVars('console', {}, req))
                }),
                fileTypes: app.srv.constants.fileTypes,
                project
            })
        })
    }
}