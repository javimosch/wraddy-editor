module.exports = app => {
	app.get('/manager', (req, res) => {
		if (!req.user || req.user.type !== 'root') {
			return res.redirect('/')
		}
		res.sendView('manager', {})
	})
}