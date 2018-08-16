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
			impl.then(handler => onReady(app, fn, handler)).catch(onError)
		} else {
			onReady(app, fn, impl)
		}
	})
}

function onReady(app, fn, impl) {
	app.functions[fn.name] = app.function[fn.name] = app.fn[fn.name] =  function(){
		let r = impl.apply(this,arguments)
		if(r instanceof Promise){
			return new Promise(async(resolve,reject)=>{
				try{
					r = await r
					console.log('Fn',fn.name, typeof r, r instanceof Array ? r.length+' items':'')
					resolve(r)
				}catch(err){
					console.log('Fn',fn.name, typeof r, r instanceof Array ? r.length+' items':'')
					reject(err)
				}
			})
		}else{
			console.log('Fn',fn.name, typeof r, r instanceof Array ? r.length+' items':'')
			return r;
		}
	}
	console.log('Function file', fn.name, 'loaded')
}

function onError(err) {
	console.error('ERROR (Function)', err.stack)
	process.exit(1);
}