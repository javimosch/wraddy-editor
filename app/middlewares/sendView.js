module.exports = {
	res: (req, res, app) => (name, data = {}) => {
		data.user = req.user || {}
		try {
			res.send(app.fn.compileFileWithVars(name, data, req));
		} catch (err) {
			console.log('ERROR', err.stack);
			res.status(500).send(err.stack);
		}
	}
}