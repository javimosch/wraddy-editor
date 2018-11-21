module.exports = app => async data => {
	try {
		if(!data.projectId) throw new Error('projectId (400)');
		await app.model('project').remove({
			_id: data.projectId
		}).exec();
		return true;
	} catch (err) {
		console.error('ERROR', err.stack);
		return false;
	}
};