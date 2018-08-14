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
			res.sendView('project-details', {
				project: await mongoose.model('project').findById(req.params.id).exec()
			})
		})
		app.get('/projects/create', async (req, res) => {
			if (!req.user) {
				return res.redirect('/login')
			}
			res.sendView('project-details', {
				project: {}
			})
		})
		app.post('/saveProject', app.fn.parseJson, async (req, res) => {
			try {
				if (!req.user) {
					return res.handleApiError(new Error(401), res, true)
				}
				if (req.user.type !== 'root' && req.user.projects.length != 0 && !req.body._id) {
					return res.handleApiError(new Error("Max. Project limit reached"), res, true)
				}
				if (!req.body._id) {
					delete req.body._id;
				}
				var payload = _.omit(req.body, ['_id', '__v', 'createdAt', 'updatedAt'])
				payload.users = payload.users || []
				payload.usersRights = payload.usersRights || []
				if (!req.body._id) {

					if (!payload.users.find(u => u._id.toString() == req.user._id)) {
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
				res.status(200).json(req.body);
			} catch (err) {
				res.handleApiError(err)
			}
		});
	}
}