module.exports = app => async function (id) {
	return await app.mongoose.model('file').findById(id).exec()
}