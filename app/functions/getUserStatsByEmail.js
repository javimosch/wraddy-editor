module.exports = app => async (email) => {
	var user= await app.mongoose.model('cloud_user').findOne({
		email
	}).select('email plan type enabled');
	if(!user){
		return {
			email,
			message:'user not found'
		}
	}
	var companies= await app.mongoose.model('organization').countDocuments({
		users:{
			$in: user._id
		}
	});
	var filesAuthor= await app.mongoose.model('file').countDocuments({
		author:user._id
	});
	var projects= await app.mongoose.model('project').find({
		users:{
			$in: user._id
		}
	}).select('_id files');
	var projectFiles = projects.map(pr=>pr.files.length).reduce((acum,v)=>acum+v,0);
	var projectsLength= projects.length;
	var stats = {
		email,
		user: user.toJSON(),
		companies,
		filesAuthor,
		projectFiles,
		projectsLength
	};
	return stats;
}