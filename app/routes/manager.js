module.exports = app => {
	app.get('/manager', (req, res) => {
		if (!req.user || req.user.type !== 'root') {
			return res.redirect('/')
		}

		var sander = require('sander')
		let functions = sander.readdirSync(require('path').join(process.cwd(), 'app/functions'))
		functions = functions.filter(f => f !== 'index.js').filter(f => {
			return f.indexOf('.js') !== -1
		});

		res.sendView('manager', {
			functions: functions.map(name => {
				return {
					name
				}
			})
		})
	})
}