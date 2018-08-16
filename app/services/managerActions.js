var sequential = require('promise-sequential')
var model = m => mongoose.model(m)
module.exports = async app => {
	return {
		ownAllFiles: async function(params){
			return 'OK2'
		},
		fixOrganizationUsersRights: async (params, req) => {
			let docs = await model('organization').find({}).exec()
			return await sequential(docs.map(d => {
				return async () => {
					d.users = d.users || []
					d.usersRights = d.usersRights || {}
					if (d.users.length != d.usersRights.length) {
						d.users.forEach(user => {
							console.log('Set right ', d.name, user._id, d.usersRights[user._id] || 'developer')
							d.usersRights[user._id] = d.usersRights[user._id] || 'developer'
						})
						d.markModified('usersRights');
						await d.save()
						return {
							name: d.name,
							r: 'fixed',
							d: d.usersRights
						}
					} else {
						return {
							name: d.name,
							r: 'healthy'
						}
					}
				}
			}))
		},
		relationUserOrganizations: async (param, req) => {
			let docs = await model('cloud_user').find({}).select('email organizations').populate('organizations').exec()
			return docs.reduce((c, d) => {
				c.push({
					email: d.email,
					organizations: d.organizations.map(o => ({
						name: o.name
					}))
				})
				return c;
			}, [])
		},
		relationOrganizationUsers: async (param, req) => {
			let docs = await model('organization').find({}).select('name users usersRights').populate('users').exec()
			return docs.reduce((c, d) => {
				c.push({
					name: d.name,
					users: d.users.map(u => ({
						email: u.email,
						right: d.usersRights[u._id] ? d.usersRights[u._id] : '[WARN:UNDEFINED]'
					}))
				})
				return c;
			}, [])
		},
		numberOfOrganizations: async (params, req) => {
			return await model('organization').count({}).exec()
		},
		syncUsersOrganizations: async (params, req) => {
			let users = await model('cloud_user').find({}).select('_id organizations').exec()
			await sequential(users.map(u => {
				return async () => {
					u.organizations = u.organizations || []
					if (u.organizations.length > 0) {
						await sequential(u.organizations.map(_id => {
							return async () => {
								let doc = await model('organization').findById(_id).select('users usersRights').exec()
								doc.usersRights = doc.usersRights || {}
								let right = doc.usersRights[u._id]
								let userInOrg = doc.users.find(ou => ou._id.toString() == u._id)
								if (!userInOrg) {
									doc.users.push(u._id)
								}
								if (!right) {
									doc.usersRights[u._id] = 'owner'
									doc.markModified('usersRights');
								}
								if (!userInOrg || !right) {
									await doc.save()
								}
							}
						}))
					}
				}
			}))
			return 'DONE'
		},
		everyUserHasAtLeastOneOrganization: async (params, req) => {
			let users = await model('cloud_user').find({}).select('_id organizations').exec()
			await sequential(users.map(u => {
				return async () => {
					u.organizations = u.organizations || []
					if (u.organizations.length === 0) {
						let doc = await model('organization').create({
							name: 'default_' + uniqid(),
							users: [u._id]
						})
						u.organizations.push(doc._id)
						await u.save()
					}
				}
			}))
			return 'DONE'
		},
		ownAllProjects: async (params, req) => {
			let prs = await model('project').find({}).select('_id users usersRights').exec()
			req.user.projects = prs.map(d => d._id)
			await sequential(prs.map(pr => {
				return async () => {
					let u = pr.users.find(u => u._id.toString() == req.user._id)
					pr.usersRights = pr.usersRights || {}
					let right = pr.usersRights[req.user._id]
					if (!u) {
						pr.users.push(req.user._id)
					}
					if (!right) {
						pr.usersRights[req.user._id] = 'owner'
					}
					if (!u || !right) {
						await pr.save()
					}
				}
			}))
			await req.user.save()
			return 'DONE'
		}
	}

}