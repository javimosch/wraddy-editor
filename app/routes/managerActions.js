module.exports = {
	order: 1,
	handler(app) {
		app.post('/managerActions', app.fn.parseJson, async (req, res) => {
			if (req.user && req.user.type === 'root') {
				if (app.srv.managerActions && app.srv.managerActions[req.body.name]) {
					try {
						let r = await app.srv.managerActions[req.body.name].apply({
							req
						},[req.body.params, req])
						res.json(r)
					} catch (err) {
						res.handleApiError(err)
					}
				} else {
					res.json({
						err: 404
					})
				}
			} else {
				res.json({
					err: 401
				})
			}
		});
	}
}