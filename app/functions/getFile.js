module.exports = app => async function(p) {
	return await app.model('file').findById(p._id).exec()
}