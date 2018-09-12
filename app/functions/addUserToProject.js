const mongoose = require('mongoose')

module.exports = app => async (data) => {
	if (!data.email) {
		throw new Error('EMAIL_REQUIRED')
	}
	if (!data.role) {
		throw new Error('ROLE_REQUIRED')
	}
	if (!data.project) {
		throw new Error('PROJECT_REQUIRED')
	}
	let user = await mongoose.model('cloud_user').findOne({
		email: data.email
	}).exec()
	if (!user) {
		throw new Error('USER_EMAIL_UNMATCH')
	} else {
		let pr = await mongoose.model('project').findOne({
			_id: data.project
		}).exec()
		if (!pr) {
			throw new Error('PROJECT_NOT_FOUND')
		} else {

			if (data.kick) {
				delete pr.usersRights[user._id]
				await mongoose.model('project').update({
					_id: pr._id
				}, {
					$pull: {
						users: user._id
					},
					$set: {
						usersRights: pr.usersRights
					}
				}).exec()
			} else {

				pr.users = pr.users || []
				pr.usersRights = pr.usersRights || {}

				//if no other user, add as owner
				let role = data.role
				if (Object.keys(pr.usersRights).length === 0) {
					role = 'owner'
				}

				pr.usersRights[user._id] = role
				console.log('DEBUG [Adding user to project]', data.email, role, pr.usersRights)
				await mongoose.model('project').update({
					_id: pr._id
				}, {
					$addToSet: {
						users: user._id
					},
					$set: {
						usersRights: pr.usersRights
					}
				}).exec()
			}

			return {
				_id: user._id,
				email: user.email
			}
		}
	}
}