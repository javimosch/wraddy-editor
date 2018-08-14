module.exports = app => async function(type, pr) {
	return app.mongoose.model('file').find({
		_id: {
			$in: pr.files
		},
		type: {
			$in: type
		}
	})
}