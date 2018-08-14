var sequential = require('promise-sequential')
var sander = require('sander')
let files = sander.readdirSync(__dirname)
files = files.filter(f => f !== 'index.js').filter(f => {
	return f.indexOf('.js') !== -1
})
module.exports = async app => {
	var self = {}
	files.forEach(f => {
		self[f.split('.')[0]] = require(__dirname + '/' + f)
	});

	let items = Object.keys(self).map((k, index) => {
		var mod = self[k]
		return {
			name: k,
			handler: mod.handler ? mod.handler : mod
		}
	})

	await sequential(items.map(srv => {
		return async () => {
			app.srv = app.srv || {}
			app.service = app.service || {}
			app.services = app.services || {}
			let impl = await srv.handler(app)
			onReady(app, srv, impl)
		}
	}))
}

function onReady(app, srv, impl) {
	app.services[srv.name] = app.service[srv.name] = app.srv[srv.name] = impl
	console.log('Service file', srv.name, 'loaded')
}

function onError(err) {
	console.error('ERROR (Service)', err.stack)
	process.exit(1);
}