module.exports = app => {
	const parseJson = app.require('body-parser').json({
		limit: '50mb'
	})
	app.post('/redirect-to-manager', parseJson, async (req, res) => {
		try {
			var rp = require('request-promise');
			if (req.body.method === 'get') {
				await rp(app.srv.constants.WRAPKEND_API + req.body.url)
			} else {
				await rp.post({
					method: 'POST',
					uri: app.srv.constants.WRAPKEND_API + req.body.url
					body: req.body.params,
					json: true
				})
			}
			res.status(200).json({})
		} catch (err) {
			console.error('ERROR', '[When redirecting post to worker]', err.stack)
			res.status(500).json({
				err: err.stack
			});
		}
	})
}