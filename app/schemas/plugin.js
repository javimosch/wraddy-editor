const mongoose = require('mongoose')
module.exports = app => {
	mongoose.model('plugin', new mongoose.Schema({
		name: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		description: {
			type: String,
		},
		authors: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'cloud_user',
			index: true
		}],
		files: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'file',
			index: true
		}],
		order:Object //files order by category
	}, {
		timestamps: true,
		toObject: {}
	}));
}