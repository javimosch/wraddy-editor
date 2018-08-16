module.exports = async app => {
	const session = require('express-session');
	const MongoStore = require('connect-mongo')(session);

	await waitMongoose()

	console.log('session configured')
	app.use(session({
		secret: 'thewrapkenawakes',
		resave: false,
		saveUninitialized: true,
		store: new MongoStore({
			mongooseConnection: app.mongoose.connection
		})
	}));

	function waitMongoose(resolve) {
		if (resolve) {
			if (app.mongoose && app.mongoose.connection) {
				return resolve()
			} else {
				return setTimeout(() => waitMongoose(resolve), 100)
			}
		}
		return new Promise((resolve, reject) => {
			return waitMongoose(resolve)
		})
	}
}