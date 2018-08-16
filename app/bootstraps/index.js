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
	let promises = []
	Object.keys(self).map((k, index) => {
		var mod = self[k]
		return {
			name: k,
			handler:mod.handler ? mod.handler : mod
		}
	}).forEach(b => {
		try {
			let result = b.handler(app)
			if(result instanceof Promise){
				promises.push(result)
			}
		} catch (err) {
			return onError(err);
		}
		console.log('Booststrap file', b.name, 'loaded')
	})

	await Promise.all(promises)
}

function onError(err) {
	console.error('ERROR (Booststrap)', err.stack)
	process.exit(1);
}