require('dotenv').config({
	silent: true
});
const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const parseJson = bodyParser.json({
	limit: '50mb'
})
const _ = require('lodash');
const pug = require('pug');
const fs = require('fs');
const PORT = 3000;
const DB_URI = process.env.DB_URI
const mongoose = require('mongoose');
const path = require('path');

mongoose.set('debug', true);

app.use('/',express.static(path.join(process.cwd(), 'assets')));

app.use((req,res,next)=>{
	res.sendView = (name, data = {}) => {
		try{
			res.send(compileFileWithVars(name, data, req));
		}catch(err){
			console.log(err);
			res.status(500).send('Ups');
		}
	}
	next();
});

app.get('/',(req,res)=>{
	res.sendView('home');
});

app.use(parseJson, (req,res,next)=>{
	console.log('REQ',req.method,req.url,Object.keys(req.body).map(k=>k + (!req.body?':Empty':'')).join(', '))
	next();
})

app.get('/resource/:type/:name',async(req,res)=>{
// http://localhost:3000/resource/vueComponent/tma-benefits-progress?ext=js
	try{
		var file = await mongoose.model('simback_file').findOne({
			name: req.params.name,
			type: req.params.type
		}).exec();

		res.type('.'+req.query.ext)
		res.send(file.code);
	}catch(err){
		handleError(err, res, 404);
	}
})

app.post('/rpc/fetch',parseJson, async (req,res)=>{
	try{
		let list = await mongoose.model('simback_file').find({
			type:req.body.type
		}).exec();
		res.status(200).json(list);
	}catch(err){
		handleError(err,res)
	}
})

app.post('/rpc/save-file', parseJson, async (req, res) => {
	try {
		mongoose.model('simback_file').findOneAndUpdate({
			name: req.body.name
		}, _.omit(req.body,['_id']), {
			upsert: true
		}).exec();
		res.status(200).json(req.body);
	} catch (err) {
		handleError(err,res)
	}
});

function handleError(err,res, status = 500){
	console.error(err);
	res.status(status).json(err.stack);
}

mongoose.connect(DB_URI, {
	server: {
		reconnectTries: Number.MAX_VALUE,
		reconnectInterval: 1000
	}
});

app.listen(PORT, function() {
	console.log('Listening on http://localhost:' + PORT)
})


function compileFileWithVars(filePath, vars = {}, req) {
	return pug.compileFile(path.join(process.cwd(), 'views',filePath.replace('.pug','')+'.pug'))(vars)
}

const schema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
		index: true
	},
	path: String,
	type:{
		type:String,
		required:true,
		enum:['view','function','route','vueComponent']
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