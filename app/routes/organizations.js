module.exports = {
	order: 0,
	handler(app) {
		app.get('/organizations', async (req, res) => {
			if (!req.user) {
				return res.redirect('/login')
			}
			res.sendView('organizations', {
				organizations: await app.fn.mongooseModel('organization').find({
					users: {
						$in: [req.user._id]
					}
				}).exec()
			})
		})
	}
}