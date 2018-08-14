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
}