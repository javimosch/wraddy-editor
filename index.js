require('dotenv').config({
	silent: true
});
const bodyParser = require('body-parser');
const parseJson = bodyParser.json({
	limit: '50mb'
})
const _ = require('lodash');
const pug = require('pug');
const fs = require('fs');
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet')
const express = require('express')
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const requireFromString = require('require-from-string');
const sander = require('sander')
const cors = require('cors')
var cache = {};
mongoose.set('debug', true);
io.on('connection', function(socket) {
	console.log('Socket connected')
});
app.use(helmet())
app.data = {
	views: {},
	dynamicViewsPath: '/app/views/dynamic'
}

app._server = server
var require_install = require('require-install');
app.requireInstall = require_install

app.lazyFn = (n) => {
	return async (req, res, next) => {
		return app.fn[n](req, res, next)
	}
}
app.wait = (seconds) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => resolve(), seconds * 1000)
	})
}
app.waitForService = async (n) => {
	if (app.service && app.service[n]) {
		return
	} else {
		for (var x = 1; x <= 20; x++) {
			await app.wait(1)
			if (app.service && app.service[n]) {
				return
			}
		}
	}
}
connectDatabase()
loadModels().then(() => {
	configureDynamicRoutes().then(() => {
		loadRoutes()
		server.listen(PORT, function() {
			console.log('Listening on http://localhost:' + PORT)
		})
		updateViews()
		configureFunctions()
		configureServices()
	})
})

function connectDatabase() {
	mongoose.connect(DB_URI, {
		server: {
			reconnectTries: Number.MAX_VALUE,
			reconnectInterval: 1000
		}
	});
}

async function getFiles(type) {
	var pr = await mongoose.model('simback_project').findOne({
		name: process.env.PROJECT,
	});
	var conditions = {
		_id: {
			$in: pr.files
		},
		type
	};
	return await mongoose.model('simback_file').find(conditions).exec()
}

async function configureDynamicRoutes() {
	let res = await getFiles('route')
	console.log('Routes', res.length)
	res.forEach(file => {
		try {
			console.log('Loading route', file.name)
			var mod = requireFromString(file.code)
			mod(app)
		} catch (err) {
			console.error(err.stack)
		}
	})
	return;
}

function loadRoutes() {

	app.use('/', express.static(path.join(process.cwd(), 'assets')));

	app.use((req, res, next) => {
		res.sendView = (name, data = {}) => {
			try {
				data.DROPLET_ADMIN_URI = process.env.DROPLET_ADMIN_URI;
				res.send(compileFileWithVars(name, data, req));
			} catch (err) {
				console.log(err);
				res.status(500).send(err.stack);
			}
		}
		res.sendDynamicView = (name, data, fail = () => {}) => {
			mongoose.model('simback_file').findOne({
				name
			}).then(file => {
				if (!file) {
					console.error('view', name, 'do not exists')
					if (fail) {
						fail()
					} else {
						res.status(500).send('unable to resolve view')
					}
				}
				try {
					res.send(compileWithVars(file.code, data, {
						DROPLET_ADMIN_URI: process.env.DROPLET_ADMIN_URI,
						filename: name,
						basedir: process.cwd() + '/app/views/dynamic'
					}));
				} catch (err) {
					console.log(err);
					res.status(500).send(err.stack);
					if (fail) {
						fail()
					} else {
						res.status(500).send('unable to resolve view')
					}
				}
			});
		}

		next();
	});

	app.post('/rpc/fetch', parseJson, async (req, res) => {
		try {
			let list = await mongoose.model('simback_file').find({
				//type: req.body.type
			}).exec();
			res.status(200).json(list);
		} catch (err) {
			handleError(err, res)
		}
	})

	app.post('/rpc/save-file', parseJson, async (req, res) => {
		try {
			if (!req.body._id) {
				delete req.body._id;
			}

			delete cache[req.body.name];
			//cache[req.body.name] = compileCode(req.body.code, true, {
			//	type: req.body.type
			//});

			var payload = _.omit(req.body, ['_id', '__v', 'createdAt', 'updatedAt'])
			if (!req.body._id) {
				var d = await mongoose.model('simback_file').create(payload)
				payload._id = d._id
			} else {
				await mongoose.model('simback_file').findOneAndUpdate({
					_id: req.body._id //,
					//name: req.body.name
				}, payload, {
					upsert: true
				}).exec();
				payload._id = req.body._id
			}


			if (req.body.project) {
				let doc = await mongoose.model('simback_project').findById(req.body.project).exec()
				if (doc) {

					var conditions = {
						_id: req.body.project,
						'files._id': {
							$ne: payload._id
						}
					};

					var update = {
						$addToSet: {
							files: payload._id
						}
					}

					await mongoose.model('simback_project').findOneAndUpdate(conditions, update).exec()

				}
			}

			if (payload.type === 'pug') {
				updateViews()
			}
			if (payload.tags.includes('service')) {
				configureServices()
			}
			if (payload.type.includes('function')) {
				configureFunctions()
			}
			io.emit('save-file')
			res.status(200).json(req.body);
		} catch (err) {
			handleError(err, res)
		}
	});

	app.post('/rpc/:name', app.lazyFn('parseJson'), async (req, res) => {
		let doc = await mongoose.model('simback_file').findOne({
			name: req.params.name,
			tags: {
				$in: ['core', 'rpc']
			}
		}).exec()
		try {
			var mod = requireFromString(doc.code)
			mod.apply({}, [req.body]).then(r => {
				res.status(200).json(r)
			}).catch(err => {
				res.status(500).send(err.stack)
			})
		} catch (err) {
			console.error(err.stack)
			res.status(500).send()
		}
	})

	app.get('/', async (req, res) => {
		await app.waitForService('bauiQueries')
		var vars = {
			projects: await app.service.bauiQueries.getProjects()
		}
		//res.sendDynamicView('editor-view',vars, ()=>{
		res.sendView('editor-view', vars);
		//})
	});

	app.get('/create-project', (req, res) => {
		res.sendView('create-project-view');
	});
	app.post('/create-project', app.lazyFn('parseForm'), async (req, res) => {
		var doc
		try {
			doc = await mongoose.model('simback_project').create(req.body)
			res.redirect(`/project/${doc._id}`)
		} catch (err) {
			app.service.errortracky.log(err)
			res.sendView('create-project-view', {
				err: true
			});
		}
	});
	app.get('/project/:id', async (req, res) => {
		let doc = await mongoose.model('simback_project').findOne({
			_id: req.params.id
		}).exec()
		res.sendView('project-details-view', doc.toJSON())
	})

	app.use(parseJson, (req, res, next) => {
		console.log('REQ', req.method, req.url, Object.keys(req.body).map(k => k + (!req.body ? ':Empty' : '')).join(', '))
		next();
	})

	app.get('/resource/:type/:name', cors(), async (req, res) => {
		// http://localhost:3000/resource/vueComponent/tma-benefits-progress?ext=js
		try {
			var code = cache[req.params.name] || ''
			if (!code) {
				var file = await mongoose.model('simback_file').findOne({
					name: req.params.name,
					type: req.params.type
				}).exec();
				code = compileCode(file.code, true, {
					minified: req.query.minified === '1',
					type: file.type
				});
				cache[file.name] = code;
			}
			res.type('.' + req.query.ext)
			res.send(code);
		} catch (err) {
			handleError(err, res, 404);
		}
	})

}

function handleError(err, res, status = 500) {
	console.error(err);
	res.status(status).json(err.stack);
}



function compileFileWithVars(filePath, vars = {}, req) {
	var p = path.join(process.cwd(), app.data.dynamicViewsPath, filePath.replace('.pug', '') + '.pug')
	var p2 = path.join(process.cwd(), 'views', filePath.replace('.pug', '') + '.pug')
	//p = p2
	if (!sander.existsSync(p) && sander.existsSync(p2)) {
		p = p2
		//p2 = p
	}
	return pug.compileFile(p)(vars)
}

function compileWithVars(raw, vars = {}, options = {}) {
	return pug.compile(raw, options)(vars)
}

function compileCode(code, browser = false, opts = {
	minified: false,
	type: 'javascript'
}) {
	if (!['javasript', 'vueComponent'].includes(opts.type)) {
		return code;
	}
	var targets = {
		"node": "6.0"
	};
	if (browser) {
		delete targets.node;
		//targets.browsers = ["5%", "last 2 versions", "Firefox ESR", "not dead"];
		targets.chrome = '30';
	}
	return require('babel-core').transform(code, {
		minified: opts.minified,
		babelrc: false,
		sourceMaps: 'inline',
		presets: [
			["env", {
				"targets": targets
			}]
		]
	}).code;
}

function loadModels() {
	return new Promise((resolve, reject) => {
		const schema = new mongoose.Schema({
			name: {
				type: String,
				required: true,
				unique: true,
				index: true
			},
			path: String,
			tags: [String],
			type: {
				type: String,
				required: true,
				//enum: ['view', 'function', 'route', 'vueComponent']
				//javascript, vueComponent, route, view, function, middleware, schedule)
			},
			code: {
				type: String,
				required: true
			}
		}, {
			timestamps: true,
			toObject: {}
		});
		mongoose.model('simback_file', schema);


		mongoose.model('simback_file').find({
			$and: [{
				$or: [{
					tags: {
						$in: ['forest-root']
					}
				}, {
					tags: {
						$in: ['core']
					}
				}]
			}, {
				tags: {
					$in: ['schema']
				}
			}]
		}).then(res => {
			res.forEach(file => {
				try {
					console.log('Loading schema', file.name)
					var mod = requireFromString(file.code)
					mod(mongoose)
				} catch (err) {
					console.error(err.stack)
				}
			})
			resolve();
		})
	})
}

function configureServices() {
	mongoose.model('simback_file').find({
		$and: [{
			tags: {
				$in: ['forest-root', 'core']
			}
		}, {
			tags: {
				$in: ['service']
			}
		}]
	}).then(res => {
		console.log('Services', res.length)
		res.forEach(file => {
			try {
				console.log('Loading service', file.name)
				var [name, impl] = requireFromString(file.code)
				if (!app.service) {
					app.service = {}
				}
				app.service[name] = impl
			} catch (err) {
				console.error(err.stack)
			}
		})

	})
}

function configureFunctions() {
	mongoose.model('simback_file').find({
		$and: [{
			$or: [{
				tags: {
					$in: ['core']
				}
			}]
		}, {
			tags: {
				$in: ['function']
			}
		}]
	}).then(res => {
		res.forEach(file => {
			try {
				console.log('Loading function', file.name)
				var mod = requireFromString(file.code)
				if (!app.fn) {
					app.fn = {}
				}
				app.fn[file.name] = mod
			} catch (err) {
				console.error(err.stack)
			}
		})

	})

}

function updateViews() {
	mongoose.model('simback_file').find({
		$and: [{
			$or: [{
				tags: {
					$in: ['forest-root']
				}
			}, {
				tags: {
					$in: ['core']
				}
			}]
		}, {
			type: 'pug'
		}]
	}).then(res => {
		console.log('Views', res.length)
		res.forEach(file => {
			try {
				file.name = file.name.split('.')[0]
				console.log('Loading view', file.name)
				app.data.views[file.name] = file.code
				sander.writeFileSync(path.join(process.cwd(), 'app/views/dynamic', file.name + '.pug'), file.code)
			} catch (err) {
				console.error(err.stack)
			}
		})
	})
}