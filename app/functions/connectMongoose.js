module.exports = app => () => {
	const DB_URI = process.env.DB_URI
	const mongoose = require('mongoose');
	mongoose.set('debug', process.env.MONGODB_DEBUG === '0' ? false : true);
	app.mongoose = mongoose
	if (!DB_URI) {
		console.error('DB_URI required')
		process.exit(0)
	}
	mongoose.connect(DB_URI, {
		server: {
			reconnectTries: Number.MAX_VALUE,
			reconnectInterval: 1000
		}
	});
}