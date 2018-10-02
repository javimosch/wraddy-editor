module.exports = app => async () => {
	var docs = await app.mongoose.model('organization').find({
		$where: "this.users.length > 0"
	}).select('name');
	return docs;
}