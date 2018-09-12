module.exports = app => async (user)=>{
	user = await app.mongoose.model('cloud_user').findById(user._id).exec()
	if(user.organizations.length===0){
		let doc = await app.mongoose.model('organization').create({
			name: "noname",
			users:[user._id],
			userRights:{
				[user._id]: 'owner'
			}
		})
		user.organizations.push(doc)
		await user.save()
	}
}