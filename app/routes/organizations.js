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
		app.get('/organization/:id/edit', async (req, res) => {
			if (!req.user) {
				return res.redirect('/login')
			}
			let item = await app.mongoose.model('organization').findById(req.params.id).exec()
			res.sendView('organization-details', {
				$meta:{
					title: item.name.length>10?item.name.substring(0,10)+'...':item.name
				},
				sidebarActiveLink: 'organization',
				item,
				_initialState:['item']
			})
		})
	}
}