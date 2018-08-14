const mongoose = require('mongoose')
module.exports = {
	order: 0,
	handler(app) {

		app.get('/register', (req, res) => {
			res.sendView('register', {})
		})
		app.post('/register', app.fn.parseJson, async (req, res) => {
			try {
				let doc = await mongoose.model('cloud_user').findOne({
					email: req.body.email
				})
				if (doc) {
					res.json({
						err: "Email in use"
					})
				} else {
					await mongoose.model('cloud_user').create({
						email: req.body.email,
						password: req.body.password
					})
					var btoa = app.requireInstall('btoa')
					res.cookie('auth', btoa(JSON.stringify({
						email: req.body.email,
						password: req.body.password
					})))
					return res.status(200).send()
				}
			} catch (err) {
				res.handleApiError(err)
			}
		})


		app.get('/login', (req, res) => {
			if (req.user) {
				return res.redirect('/')
			}
			res.sendView('login', {

			})
		})
		app.post('/login', app.fn.parseJson, async (req, res) => {
			try {
				let doc = await require('mongoose').model('cloud_user').findOne({
					email: req.body.email,
					password: req.body.password
				})
				if (doc) {
					var btoa = app.requireInstall('btoa')
					res.cookie('auth', btoa(JSON.stringify({
						email: req.body.email,
						password: req.body.password
					})))
					return res.status(200).send()
				}
				res.json({
					err: "Invalid credentials"
				})
			} catch (err) {
				res.handleApiError(err)
			}
		})

		app.get('/logout', (req, res) => {
			res.cookie('auth', '')
			res.redirect('/')
		})

	}
}