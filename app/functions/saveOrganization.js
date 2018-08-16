module.exports = app => async function(data) {
	const req = this.req;
	if (req.user.type !== 'root' && !req.body._id) {
		return res.handleApiError(new Error("You can't create more organizations for the moment"), res, true)
	}
	if (!req.body._id) {
		delete req.body._id;
	}
	var payload = app._.omit(req.body, ['_id', '__v', 'createdAt', 'updatedAt'])
	payload.users = payload.users || []
	payload.usersRights = payload.usersRights || []
	if (!req.body._id) {
		if (!payload.users.find(u => u._id.toString() == req.user._id)) {
			payload.users.push(req.user._id)
			payload.usersRights[req.user._id] = 'owner'
		}
		var d = await app.mongoose.model('organization').create(payload)
		payload._id = d._id
	} else {
		await app.mongoose.model('organization').findOneAndUpdate({
			_id: req.body._id
		}, payload, {
			upsert: true
		}).exec();
		payload._id = req.body._id
	}
	return payload
}