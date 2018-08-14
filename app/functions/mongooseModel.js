const mongoose = require('mongoose')
module.exports = app => modelName => mongoose.model(modelName)