module.exports = app => async (email, enabled) => {
	var user= await app.mongoose.model('cloud_user').findOne({
		email
	});
	if(!user) throw new Error('USER_NOT_FOUND');
	await app.mongoose.model('cloud_user').update({
		email
	},{
		$set:{
			enabled
		}
	});
	return await app.fn.getUserStatsByEmail(email);
}