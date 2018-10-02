module.exports = app => async (user) => {
	var sequential = require('promise-sequential')
	var docs= await app.mongoose.model('cloud_user').find({
		
	}).select('email');
	docs = docs.map(d=>{
		d = d.toJSON();
		return d;
	})
	return await sequential(docs.map(doc=>{
		return async()=>{
			return await app.fn.getUserStatsByEmail(doc.email);
		}
	}))
}