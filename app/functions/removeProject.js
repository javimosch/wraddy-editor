module.exports = app => async data => {
	return await app.model('file').remove({
		_id: data._id
	}).exec()
}