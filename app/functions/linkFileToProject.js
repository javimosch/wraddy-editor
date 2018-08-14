module.exports = app => async (fileId, projectId) => {
	var conditions = {
		_id: projectId,
		'files._id': {
			$ne: fileId
		}
	};
	var update = {
		$addToSet: {
			files: fileId
		}
	}
	return await app.model('project').findOneAndUpdate(conditions, update).exec()
}