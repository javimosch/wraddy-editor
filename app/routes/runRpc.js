module.exports = {
	order: 1,
	handler(app) {
		app.post('/rpc/:name', app.fn.parseJson, async (req, res) => {
			if (app.fn[req.params.name]) {
				try {
					res.status(200).json(await app.fn[req.params.name](req.body, req))
				} catch (err) {
					res.handleApiError(err)
				}
			} else {
				res.handleApiError(new Error('FUNCTION_NOT_FOUND'))
			}
		});
		app.post('/runRpc', app.fn.parseJson, async (req, res) => {
			if (req.user && req.user.type === 'root') {
				if (app.srv.rpc && app.srv.rpc[req.body.name]) {
					try {
						let r = await app.srv.rpc[req.body.name](req.body.params, req)
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