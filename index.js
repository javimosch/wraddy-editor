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

var cache = {};

mongoose.set('debug', true);
const express = require('express')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

io.on('connection', function (socket) {
  console.log('Socket connected')
});

app.use('/', express.static(path.join(process.cwd(), 'assets')));

app.use((req, res, next) => {
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

app.get('/', (req, res) => {
	res.sendView('editor');
});

app.use(parseJson, (req, res, next) => {
	console.log('REQ', req.method, req.url, Object.keys(req.body).map(k => k + (!req.body ? ':Empty' : '')).join(', '))
	next();
})

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
		if (!req.body._id) {
			delete req.body._id;
		}
		cache[req.body.name] = compileCode(req.body.code, true, {
			type: req.body.type
		});

		var payload = _.omit(req.body, ['_id', '__v', 'createdAt', 'updatedAt'])
		if (!req.body._id) {
			await mongoose.model('simback_file').create(payload)
		} else {
			await mongoose.model('simback_file').findOneAndUpdate({
				_id: req.body._id //,
				//name: req.body.name
			}, payload, {
				upsert: true
			}).exec();
		}
		io.emit('save-file')
		res.status(200).json(req.body);
	} catch (err) {
		handleError(err, res)
	}
});

function handleError(err, res, status = 500) {
	console.error(err);
	res.status(status).json(err.stack);
}

mongoose.connect(DB_URI, {
	server: {
		reconnectTries: Number.MAX_VALUE,
		reconnectInterval: 1000
	}
});

server.listen(PORT, function() {
	console.log('Listening on http://localhost:' + PORT)
})


function compileFileWithVars(filePath, vars = {}, req) {
	var p = path.join(process.cwd(), 'views', filePath.replace('.pug', '') + '.pug')
	return pug.compileFile(p)(vars)
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



//mongoose.model('simback_file').remove({}).exec()