const mongoose = require('mongoose')
module.exports = app => {
	mongoose.model('project', new mongoose.Schema({
		name: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		label: {
			type: String,
		},
		shortText: {
			type: String,
		},
		domain: {
			type: String
		},
		privateKey: {
			type: String,
			index: true
		},
		plugins: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'plugin'
		}],
		users: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'cloud_user',
			index: true
		}],
		usersRights: Object,
		files: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'file'
		}],
		description: {
			type: String,
			default: ''
		},
		settings: {
			type: Object,
			default: {}
		},
	}, {
		timestamps: true,
		toObject: {}
	}));
}