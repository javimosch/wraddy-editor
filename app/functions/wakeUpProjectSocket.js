module.exports = app => async ({
	privateKey
}) => {
	let pr = await app.mongoose.model('project').findOne({
		privateKey: privateKey
	}).exec()
	await app.srv.projectSockets.markAsAlive(pr)
	return pr.name
}