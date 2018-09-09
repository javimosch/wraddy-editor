module.exports = app => (server) => {
	const io = app.io = require('socket.io')(server);
	/*
	const errorsIo = app.errorsIo  = io.of('/errors');
	errorsIo.on('connection', function(socket) {
		console.log('DEBUG','[Socket client connection]','errors namespace')
	})*/

	require('mongoose').model('project').find({}).exec().then(prs => {
		prs.forEach(pr => {
			app.srv.editorIO.prepareErrorIo(pr.name)
		});
	});

	io.on('connection', function(socket) {

	})
}