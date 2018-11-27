const _ = require('lodash')
const mongoose = require('mongoose')

function getUrl(pr, app) {
	try {
		let env = app.srv.constants.NODE_ENV
		pr.settings.envs[env] = pr.settings.envs[env] || {}
		let defaultDomain = pr.label ? pr.label.toLowerCase().replace(/[^\w\s]/gi, '').split('_').join('').split('.').join('') + '.wrapkend.com' : ''
		let rawIp = `http://${app.srv.constants.WRAPKEND_IP}:${pr.settings.envs[env].PORT}/`;
		let ip = defaultDomain ? defaultDomain : rawIp
		return 'https://' + ip.split('https://').join('https://');
	} catch (err) {
		console.log('WARN [while getting project url]', err.stack)
		return ''
	}
}

module.exports = {
	order: 0,
	handler(app) {
		app.get('/projects', async (req, res) => {
			if (!req.user) {
				return res.redirect('/login')
			}
			let projects = await mongoose.model('project').find({
				users: {
					$in: [req.user._id]
				}
			}).exec()

			var all_projects = []

			if (req.user.type === 'root') {
				all_projects = await mongoose.model('project').find({}).select('name settings label domain').exec()
				all_projects = all_projects.map(pr => {
					pr = pr.toJSON()
					pr = {
						checked: false,
						label: pr.label,
						name: pr.name,
						enabled: false,
						domains: (pr.domain || "").trim().split(',').map(d => {
							let url = d.split('https://').join('')
							if (url) {
								return 'https://' + url
							} else {
								return ''
							}
						}).concat(getUrl(pr, app)).filter(d => d !== '').reduce((a, v) => {
							a[v] = false
							return a;
						}, {})
					}
					return pr;
				})
			}

			let tabs = [{
				label: "My projects",
				name: 'my_projects'
			}]
			if (req.user.type === 'root') {
				tabs.push({
					label: 'Status',
					name: 'status'
				})
			}

			res.sendView('projects', {
				tabs: {
					items: tabs
				},
				sidebarActiveLink: 'projects',
				initialState: {
					user: req.user,
					projects,
					all_projects
				},
				projects
			})
		});

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

			project = await fixProject(project)

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
		});

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
		});

		app.post('/saveProject', app.fn.parseJson, async (req, res) => {
			try {
				if (!req.user) {
					return res.handleApiError(new Error(401), res, true)
				}
				
				req.body.label = req.body.name; //the app name works as public domain as well

				if (!req.body.label) {
					throw new Error('LABEL_REQUIRED')
				} else {
					if (app.srv.constants.subdomainsBlacklist.includes(req.body.label)) {
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
				
				await app.fn.configureProject({
					projectId: payload._id,
					userId: req.user._id
				});

				res.status(200).json(payload);
			} catch (err) {
				res.handleApiError(err)
			}
		});
	}
}


async function fixProject(pr) {
	if (typeof pr === 'string') {
		pr = await mongoose.model('project').findById(pr).exec()
	}
	pr = pr.toJSON()
	pr.settings = pr.settings || {}
	pr.settings.envs = pr.settings.envs || {}
	//await pr.save();
	console.log('DEBUG [after fix project]', pr)
	return pr;
}