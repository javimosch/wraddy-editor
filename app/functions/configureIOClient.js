const path = require('path')
module.exports = app => (file, project) => {
	let url = app.srv.constants.WRAPKEND_API
	console.log('Targeting wrapkend manager', url)
	var socket = require('socket.io-client')(url);
	socket.on('connect', function() {
		console.log('DEBUG','[After connection to socket success]')
	});
	socket.on('event', function(data) {});
	socket.on('disconnect', function() {});
	app.managerSocket = socket;
}