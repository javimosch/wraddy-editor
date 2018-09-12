const _ = require('lodash')
const mongoose = require('mongoose')

module.exports = {
	order: 0,
	handler(app) {
		app.get('/projects', async (req, res) => {
			if (!req.user) {
				return res.redirect('/login')
			}
			res.sendView('projects', {

				sidebarActiveLink: 'projects',
				projects: await mongoose.model('project').find({
					users: {
						$in: [req.user._id]
					}
				}).exec()
			})
		})
		app.get('/project/:id/edit', async (req, res) => {
			if (!req.user) {
				return res.redirect('/login')
			}

			let project = await mongoose.model('project').findById(req.params.id)
				.populate('users', 'email')
				.exec()

			if (!project.users.find(u => u._id.toString() == req.user._id.toString())) {

				return res.status(401).send()
			}

			project = await fixProject(project._id.toString())

			res.sendView('project-details', {
				tabs: {
					items: [{
						label: "General"
					}, {
						label: 'Service Accounts',
						name: 'users'
					}]
				},
				server: app.srv.constants,
				sidebarActiveLink: 'projects',
				project
			})
		})
		app.get('/projects/create', async (req, res) => {
			if (!req.user) {
				return res.redirect('/login')
			}
			res.sendView('project-details', {
				server: app.srv.constants,
				sidebarActiveLink: 'projects',
				tabs: {
					items: [{
						label: "General"
					}]
				},
				project: {
					users: [
						req.user._id
					],
					usersRights: {
						[req.user._id]: 'owner'
					},
					settings: {
						envs: {
							development: {},
							production: {}
						}
					}
				}
			})
		})
		app.post('/saveProject', app.fn.parseJson, async (req, res) => {
			try {
				if (!req.user) {
					return res.handleApiError(new Error(401), res, true)
				}

				if (!req.body.label) {
					throw new Error('LABEL_REQUIRED')
				} else {
					if (['jobs', 'contact', 'team', 'editor', 'beta', 'dev', 'blog', 'news', 'site', 'hire', 'wrapkend'].includes(req.body.label)) {
						throw new Error('LABEL_REQUIRED')
					}
				}

				if (req.user.type !== 'root' && req.user.projects.length != 0 && !req.body._id) {
					return res.handleApiError(new Error("PROJECTS_LIMIT"), res, true)
				}
				if (!req.body._id) {
					delete req.body._id;
				}
				var payload = _.omit(req.body, ['_id', '__v', 'createdAt', 'updatedAt'])


				async function validateBeforeSave() {
					if (!await isLabelValid(payload, req.body._id)) {
						throw new Error('LABEL_TAKEN')
					}
				}

				async function isLabelValid(data, _id) {
					console.log('DEBUG', '[isLabelValid]', data.label, _id)
					if (data.label) {
						let query = {
							label: data.label
						};
						if (_id && !['new', '-1'].includes(_id)) {
							query._id = {
								$ne: _id
							}
						}
						return !(await app.mongoose.model('project').findOne(query).exec())
					}
				}

				await validateBeforeSave();

				payload.users = payload.users || []
				payload.usersRights = payload.usersRights || {}
				if (!req.body._id) {

					if (!payload.users.find(u => (u._id || u).toString() == req.user._id)) {
						payload.users.push(req.user._id)
						payload.usersRights[req.user._id] = 'owner'
					}


					var d = await mongoose.model('project').create(payload)
					payload._id = d._id
				} else {
					await mongoose.model('project').findOneAndUpdate({
						_id: req.body._id
					}, payload, {
						upsert: true
					}).exec();
					payload._id = req.body._id
				}



				await fixProject(payload._id.toString())

				await app.fn.attachProjectToUser(req.user, payload._id)

				res.status(200).json(req.body);
			} catch (err) {
				res.handleApiError(err)
			}
		});
	}
}


async function fixProject(pr) {
	if(typeof pr === 'string' ){
		pr = await mongoose.model('project').findById(pr).exec()
	}
	pr = pr.toJSON()
	pr.settings = pr.settings || {}
	pr.settings.envs = pr.settings.envs || {}
	//await pr.save();
	console.log('DEBUG [after fix project]', pr)
	return pr;
}