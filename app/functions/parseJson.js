module.exports = app => {
	const bodyParser = require('body-parser');
	const parseForm = bodyParser.urlencoded({
		limit: '50mb',
		extended: false
	})
	return bodyParser.json({
		limit: '50mb'
	})
}