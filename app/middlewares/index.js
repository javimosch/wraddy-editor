var sander = require('sander')
let files = sander.readdirSync(__dirname)
files = files.filter(f => f !== 'index.js').filter(f => {
	return f.indexOf('.js') !== -1
})
module.exports = app => {
	var self = {}
	files.forEach(f => {
		self[f.split('.')[0]] = require(__dirname + '/' + f)
	});

	let requestMethods = Object.keys(self).map(k => self[k]).filter(i => i.req != undefined)
	console.log('Request methods added', requestMethods.length)

	let responseMethods = Object.keys(self).map(k => {
		self[k].name = k
		return self[k]
	}).filter(i => i.res != undefined);
	console.log('Response methods added', responseMethods.length, responseMethods.map(i => i.name).join(', '))

	app.use((req, res, next) => {

		requestMethods.forEach(i => {
			req[i.name] = i.req(req, res, app);
		})

		responseMethods.forEach(i => {
			res[i.name] = i.res(req, res, app);
			console.log('ADDED', i.name, typeof res[i.name])
		})

		next();
	})


	Object.keys(self).filter(k => self[k].res === undefined && self[k].req === undefined).map((k, index) => {
		var mod = self[k]
		return {
			name: k,
			order: mod.order !== undefined ? mod.order : index,
			handler: mod.handler ? mod.handler : mod
		}
	}).sort((a, b) => {
		return a.order < b.order ? -1 : 1
	}).forEach(middleware => {
		if (middleware.handler instanceof Array) {
			app.use.apply(app, middleware.handler.map(h => h(app)))
		} else {
			app.use(middleware.handler(app))
		}
		console.log('Middleware file', middleware.name, 'loaded')
	})
}