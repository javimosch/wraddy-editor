const mongoose = require('mongoose')

module.exports = app => async (data) => {
	if(!data.email){
		throw new Error('EMAIL_REQUIRED')
	}
	if(!data.role){
		throw new Error('ROLE_REQUIRED')
	}
	if(!data.project){
		throw new Error('PROJECT_REQUIRED')
	}
	let user = mongoose.model('cloud_user').findOne({
		email: data.email
	}).exec()
	if(!user){
		throw new Error('USER_NOT_FOUND')
	}else{
		let pr = await mongoose.model('project').findOne({
			_id: data.project
		}).exec()
		if(!pr){
			throw new Error('PROJECT_NOT_FOUND')
		}else{
			pr.users = pr.users || []
			mongoose.model('project').update({
				_id: pr._id
			},{
				$addToSet:{
					users:user._id
				}
			})
			pr.userRights = pr.userRights || {}
			pr.userRights[user._id] = data.role
			await pr.save();
		}
	}
}