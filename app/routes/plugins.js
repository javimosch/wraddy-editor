const _ = require('lodash')
const mongoose = require('mongoose')

module.exports = app => {

	app.get('/plugins', async (req, res) => {
		if (!req.user) {
			return res.redirect('/login')
		}
		if (!req.context.organization) {
			throw new Error('COMPANY_NOT_FOUND')
		}
		let company = await mongoose.model('organization').findById(req.context.organization._id).populate('plugins').exec();
		let globalCount = await mongoose.model('plugin').countDocuments({
			public: true
		}).exec();
		let pluginsCount = req.context.organization.plugins && req.context.organization.plugins.length || 0
		let tab = pluginsCount > 0 ? 'company_plugins' : 'browse_plugins'
		res.sendView('plugins', {
			initialState: {
				globalCount,
				pluginsCount,
				user: req.user,
				tab,
				company
			},
			sidebarActiveLink: 'plugins',
			$meta: {
				title: "Plugins"
			},
			layout: {
				sidebar: true
			},
			pluginsCount,
			tabs: {
				default: tab,
				items: [{
					label: `Organization plugins`,
					name: "company_plugins"
				}, {
					label: "Community plugins",
					name: "browse_plugins"
				}]
			}
		})
	});

	app.get('/plugin/:id', async (req, res) => {
		if (!req.user) {
			return res.redirect('/login')
		}
		var item;
		if (req.params.id !== 'new') {
			item = await mongoose.model('plugin').findById(req.params.id).exec()
		}
		res.sendView('plugin-details', {
			initialState: {
				item: item || {},
				user: req.user,
				tab: 'general'
			},
			sidebarActiveLink: 'plugins',
			$meta: {
				title: item ? item.name : "New Plugin"
			},
			layout: {
				sidebar: true
			},
			tabs: {
				default: 'general',
				items: [{
					label: `General`,
					name: "general"
				}]
			}
		})
	});

	app.post('/plugin', app.fn.parseJson, async (req, res) => {
		if (!req.user) {
			return res.redirect('/login')
		}
		if (!req.context.organization) {
			throw new Error('COMPANY_NOT_FOUND')
		}
		let payload = req.body
		if (!payload._id) {
			var r = await mongoose.model('plugin').create(payload)
			payload._id = r._id
			console.log('TRACE [afer create]', payload)
			await mongoose.model('organization').update({
				_id: req.context.organization._id
			}, {
				$addToSet: {
					plugins: payload._id.toString()
				}
			}).exec()
		} else {
			await mongoose.model('plugin').findOneAndUpdate({
				_id: req.body._id
			}, payload, {
				upsert: true
			}).exec();
			payload._id = req.body._id
		}
		res.json({
			_id: payload._id
		})
	})
}