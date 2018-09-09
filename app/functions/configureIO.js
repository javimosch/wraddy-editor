module.exports = app => (server) => {
	const io = app.io = require('socket.io')(server);
	const errorsIo = app.errorsIo  = io.of('/errors');
	errorsIo.on('connection', function(socket) {
		console.log('DEBUG','[Socket client connection]','errors namespace')
	})
	io.on('connection', function(socket) {
		
	})
}