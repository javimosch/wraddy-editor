module.exports = {
	order: 1,
	handler(app) {
		app.post('/rpc/:name',app.fn.checkAuth(), app.fn.parseJson, async (req, res) => {
			if (app.fn[req.params.name]) {
				try {
					let params = [req.body]
					if(req.body.$params){
						params = req.body.$params
					}
					res.status(200).json(await app.fn[req.params.name].apply({
						req
					},params))
				} catch (err) {
					res.handleApiError(err)
				}
			} else {
				console.log('TRACE [function name]',req.params)
				res.handleApiError(new Error('FUNCTION_NOT_FOUND'))
			}
		});
	}
}