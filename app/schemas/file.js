const mongoose = require('mongoose')
module.exports = app => {
	const schema = new mongoose.Schema({
		name: {
			type: String,
			required: true,
			index: true
		},
		tags: [String],
		type: {
			type: String,
			required: true,
		},
		code: {
			type: String,
			required: true
		}
	}, {
		timestamps: true,
		toObject: {}
	});
	mongoose.model('file', schema);
}