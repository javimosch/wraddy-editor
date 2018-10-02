module.exports = app => async (user) => {
	return app.mongoose.model('organization').remove({
		users: []
	});
}