module.exports = app => async (user) => {
	var docs= await app.mongoose.model('cloud_user').find({
		
	});
	docs = docs.map(d=>{
		d = d.toJSON();
		d = d.email;
		return d;
	})
	return docs;
}