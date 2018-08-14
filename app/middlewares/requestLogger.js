module.exports = {
	order:0,
	handler: [app => (req, res, next) => app.fn.parseJson(req, res, next), app => (req, res, next) => {
		console.log('REQ', req.method, req.url, Object.keys(req.body).map(k => k + (!req.body ? ':Empty' : '')).join(', '))
		next();
	}]
}