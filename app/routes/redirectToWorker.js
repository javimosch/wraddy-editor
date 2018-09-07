module.exports = app => {
	const parseJson = app.require('body-parser').json({
		limit: '50mb'
	})
	app.post('/redirect-to-manager', parseJson, async (req, res) => {
		try {
			var rp = app.require('request-promise');
			var result 
			if (req.body.method === 'get') {
				result  = await rp(app.srv.constants.WRAPKEND_API + req.body.url)
				result = JSON.parse(result)
			} else {
				result = await rp.post({
					method: 'POST',
					uri: app.srv.constants.WRAPKEND_API + req.body.url,
					body: req.body.params,
					json: true
				})
			}
			console.log('DEBUG','[after redirection to manager]',req.body.url,'Result is',result)
			res.status(200).json(result)
		} catch (err) {
			console.error('ERROR', '[When redirecting post to worker]', err.stack)
			res.status(500).json({
				err: err.stack
			});
		}
	})
}