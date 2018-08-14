module.exports = app => {
	const bodyParser = require('body-parser');
	return bodyParser.urlencoded({
		limit: '50mb',
		extended: false
	})
}