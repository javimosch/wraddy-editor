module.exports = app => async (email) => {
	var user = await app.mongoose.model('cloud_user').findOne({
		email
	});
	if (!user) {
		throw new Error('USER_NOT_FOUND');
	}
	await app.fn.createDefaultOrganization(user);
	return app.fn.getUserStatsByEmail(user.email);
}