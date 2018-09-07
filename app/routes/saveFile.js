module.exports = {
    order: 2,
    handler(app) {
        app.post('/saveFile', app.fn.parseJson, async (req, res) => {
            try {
                var {
                    file,
                    project
                } = req.body
                if (!file._id) {
                    delete file._id;
                }
                var payload = app._.omit(file, ['_id', '__v', 'createdAt', 'updatedAt'])
                payload.code = payload.code || ''
                if (!file._id || file._id === 'new') {
                    var d = await app.mongoose.model('file').create(payload)
                    payload._id = d._id
                } else {
                    await app.mongoose.model('file').findOneAndUpdate({
                        _id: file._id
                    }, payload, {
                        upsert: true
                    }).exec();
                    payload._id = file._id
                }

                if (project) {
                    console.log('INFO: Link and emit')
                    await app.fn.linkFileToProject(payload._id, project)
                    var prs = (await app.mongoose.model('project').find({
                        'files': payload._id
                    })).map(pr => pr._id)
                    
                    /*
                    app.srv.projectSockets.emit(project, 'save-file', {
                        prs,
                        _id: payload._id
                    })*/

                    app.fn.emitSaveFile(payload, await app.mongoose.model('project').findById(project))
                    
                }else{
                    console.log('WARN: No project')
                }



                res.status(200).json(payload);
            } catch (err) {
                res.handleApiError(err)
            }
        });
    }
}