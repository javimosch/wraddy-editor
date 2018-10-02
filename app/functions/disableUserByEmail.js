module.exports = app => async (email) => {
	var user = await app.mongoose.model('cloud_user').findOne({
		email
	});
	if (!user) {
		throw new Error('USER_NOT_FOUND');
	}
	await app.mongoose.model('file').update({
		author: user._id
	}, {
		$set: {
			author: null
		}
	});
	await app.mongoose.model('organization').update({
		users: {
			$in: user._id
		}
	}, {
		$pull: {
			users: user._id
		}
	});
	await app.mongoose.model('project').update({
		users: {
			$in: user._id
		}
	}, {
		$pull: {
			users: user._id
		}
	});
	await app.mongoose.model('cloud_user').update({
		email
	},{
		$set:{
			enabled:false
		}
	});
	return await app.fn.getUserStatsByEmail(email);
}