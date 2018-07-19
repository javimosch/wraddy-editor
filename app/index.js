require('dotenv').config({
	silent: true
});
const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const parseForm = bodyParser.urlencoded({
	limit: '50mb',
	extended: false
})
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
const VIEWS_BASE_DIR = __dirname
const sander = require('sander')
const requireFromString = require('require-from-string');

var socket
if(process.env.SOCKET_URI){
	socket = require('socket.io-client')(process.env.SOCKET_URI);
}

socket.on('connect', function(){
	console.log('Socket online')
});
socket.on('event', function(data){});
socket.on('disconnect', function(){});
socket.on('save-file', function(){
	console.log('SAVE FILE, EXIT')
	process.exit(0)
});


var cache = {};

app.data = {
	logged: false,
	views: {}
}

mongoose.set('debug', true);

configureMiddlewares()
configureStaticRoutes()
configureDatabase()
configureDynamicMiddlewares()
//->configureServices
//->configureDynamicRoutes
//->onRouteDefinitionFinish
//-> server listen
configureDynamicViews()

function configureDynamicViews() {
	mongoose.model('simback_file').find({
		$and: [{
			tags: {
				$in: ['forest-root']
			}
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

function configureDynamicMiddlewares() {
	mongoose.model('simback_file').find({
		$and: [{
			tags: {
				$in: ['forest-root']
			}
		}, {
			tags: {
				$in: ['middleware']
			}
		}]
	}).then(res => {
		console.log('Middlewares', res.length)
		res.forEach(file => {
			try {
				console.log('Loading middleware', file.name)
				var mod = requireFromString(file.code)
				app.use(mod)
			} catch (err) {
				console.error(err.stack)
			}
		})
		configureServices()
	})
}

function configureMiddlewares() {
	app.use('/', express.static(path.join(process.cwd(), 'assets')));

	app.use((req, res, next) => {
		req.logged = app.data.logged || false;
		res.sendView = (name, data = {}) => {
			try {
				res.send(compileFileWithVars(name, data, req));
			} catch (err) {
				console.log(err);
				res.status(500).send('Ups');
			}
		}
		next();
	});

	app.use(parseJson, (req, res, next) => {
		console.log('REQ', req.method, req.url, Object.keys(req.body).map(k => k + (!req.body ? ':Empty' : '')).join(', '))
		next();
	})
}



function configureStaticRoutes() {
	app.post('/login', parseForm, (req, res) => {
		if (req.body.password === process.env.ROOT_PASSWORD) {
			app.data.logged = true
		}
		res.redirect('/')
	})

	app.get('/restart-process', (req, res) => {
		if (!req.logged) {
			res.redirect('/')
		}
		res.redirect('/')
		setTimeout(function() {
			console.log('graceful process restart')
			process.exit(0)
		}, 1000)
	})

	app.get('/logout', (req, res) => {
		app.data.logged = false
		res.redirect('/')
	})

	app.get('/', async (req, res) => {
		if (req.logged) {
			let sitesExists = await sander.exists(path.join(process.cwd(), 'sites'))
			let sites = (sitesExists && (await sander.readdir(path.join(process.cwd(), 'sites')))) || []

			res.sendView('dashboard', {
				sites,
				sitesExists
			});
		} else {
			res.sendView('login');
		}
	});



	app.get('/resource/:type/:name', async (req, res) => {
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
			cache[req.body.name] = compileCode(req.body.code, true, {
				type: req.body.type
			});
			mongoose.model('simback_file').findOneAndUpdate({
				_id: req.body._id //,
				//name: req.body.name
			}, _.omit(req.body, ['_id', '__v']), {
				upsert: true
			}).exec();
			res.status(200).json(req.body);
		} catch (err) {
			handleError(err, res)
		}
	});
}

function configureServices() {
	mongoose.model('simback_file').find({
		$and: [{
			tags: {
				$in: ['forest-root']
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
		configureDynamicRoutes()
	})
}

function configureDynamicRoutes() {
	mongoose.model('simback_file').find({
		$and: [{
			tags: {
				$in: ['forest-root']
			}
		}, {
			tags: {
				$in: ['route']
			}
		}]
	}).then(res => {
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
		onRouteDefinitionFinish()
	})
}

function onRouteDefinitionFinish() {
	app.listen(PORT, function() {
		console.log('Listening on http://localhost:' + PORT)
	})
}

function handleError(err, res, status = 500) {
	console.error(err);
	res.status(status).json(err.stack);
}


function configureDatabase() {
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
			tags: {
				$in: ['forest-root']
			}
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
	})
}


function compileFileWithVars(filePath, vars = {}, req) {
	var p = path.join(VIEWS_BASE_DIR, 'views', filePath.replace('.pug', '') + '.pug')
	if (sander.existsSync(p)) {
		return pug.compileFile(p)(vars)
	} else {
		p = path.join(VIEWS_BASE_DIR, 'views/dynamic', filePath.replace('.pug', '') + '.pug')
		return pug.compileFile(p)(vars)
	}
}


function compileCode(code, browser = false, opts = {
	minified: false,
	type: 'javascript'
}) {
	if (!['javascript', 'vueComponent'].includes(opts.type)) {
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



//mongoose.model('simback_file').remove({}).exec()