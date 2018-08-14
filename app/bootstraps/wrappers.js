module.exports = app => {
	app._ = require('lodash');
	app.uniqid = require('uniqid');
	app.sequential = require('promise-sequential')
	app.model = m => require('mongoose').model(m)
	app.requireInstall = require('require-install');
	app.requireFromString = require('require-from-string');
	app.sander = require('sander')
	app.mongoose = require('mongoose')
}