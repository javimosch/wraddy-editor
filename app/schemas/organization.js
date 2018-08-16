const mongoose = require('mongoose')
module.exports = app => {
	mongoose.model('organization', new mongoose.Schema({
		name: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		description: {
			type: String,
			default: ''
		},
		website: {
			type: String,
			default: ''
		},
		users: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'cloud_user',
			index: true
		}],
		usersRights: Object,
	}, {
		timestamps: true,
		toObject: {}
	}));

	mongoose.model('organization_files', new mongoose.Schema({
		organization: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'organization',
			index: true
		},
		file: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'file',
			index: true
		}
	}, {
		timestamps: true,
		toObject: {}
	}));
}