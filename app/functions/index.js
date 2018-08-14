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
	Object.keys(self).map((k, index) => {
		var mod = self[k]
		return {
			name: k,
			handler: mod.handler ? mod.handler : mod
		}
	}).forEach(fn => {
		app.fn = app.fn || {}
		app.function = app.function || {}
		app.functions = app.functions || {}
		let impl = fn.handler(app)
		if (impl instanceof Promise) {
			impl.then(handler => onReady(app,fn, handler)).catch(onError)
		} else {
			onReady(app, fn, impl)
		}
	})
}

function onReady(app, fn, impl) {
	app.functions[fn.name] = app.function[fn.name] = app.fn[fn.name] = impl
	console.log('Function file', fn.name, 'loaded')
}
function onError(err){
	console.error('ERROR (Function)', err.stack)
	process.exit(1);
}