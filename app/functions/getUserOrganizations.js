module.exports = app => async function(userId) {
	if(!userId) return [];
	return await app.mongoose.model('organization').find({
		users: {
			$in: [userId._id?userId._id:userId]
		}
	}).exec()
}