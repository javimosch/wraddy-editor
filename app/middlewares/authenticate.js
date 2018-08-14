module.exports = {
	order:1,
	handler: app => async (req, res, next) => {
		try {
			if (!req.cookies) {
				console.log('WARN: cookie-parser required')
			}
			let auth = req.cookies && req.cookies.auth
			if (auth) {
				var atob = app.requireInstall('atob')
				auth = atob(auth)
				auth = JSON.parse(auth)
				let doc = await require('mongoose').model('cloud_user').findOne({
					email: auth.email,
					password: auth.password
				}).exec()
				if (doc) {
					//console.log('authenticate ok')
					req.user = doc;
				}
			}
			next()
		} catch (err) {
			console.error(err.stack)
			res.send(err.stack)
		}
	}
}