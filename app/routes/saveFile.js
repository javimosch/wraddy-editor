module.exports = {
    order: 2,
    handler(app) {
        app.post('/saveFile', app.fn.parseJson, async (req, res) => {
            try {
                if (!req.body._id) {
                    delete req.body._id;
                }
                var payload = app._.omit(req.body, ['_id', '__v', 'createdAt', 'updatedAt'])
                payload.code = payload.code || ''
                if (!req.body._id || req.body._id === 'new') {
                    var d = await app.mongoose.model('file').create(payload)
                    payload._id = d._id
                } else {
                    await app.mongoose.model('file').findOneAndUpdate({
                        _id: req.body._id
                    }, payload, {
                        upsert: true
                    }).exec();
                    payload._id = req.body._id
                }
                res.status(200).json(payload);
            } catch (err) {
                res.handleApiError(err)
            }
        });
    }
}