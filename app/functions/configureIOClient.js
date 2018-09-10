const path = require('path')
module.exports = app => (file, project) => {
	let url = app.srv.constants.WRAPKEND_API
	console.log('Targeting wrapkend manager', url)
	var socket = require('socket.io-client')(url);
	socket.on('connect', function() {
		console.log('DEBUG', '[After connection to socket success]')
	});
	socket.on('event', function(data) {});
	socket.on('disconnect', function() {});
	socket.on('projectLog', data => {
		
		let io = app.srv.editorIO.getErrorIo(data.name)
		if(io){
			console.log('DEBUG [projectLog]', data.name, data.type, data.message);

			//client: console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)

			let tz = 'Europe/Paris'
			let moment = app.require('moment-timezone')
			let now = moment().tz(tz).format("HH:mm:ss.SSS")
			data.t = now;

			io.emit('projectLog', data);
		}else{
			console.log('DEBUG [projectLog][io not found]', data.name, data.type, data.message);
		}
	})

	app.managerSocket = socket;
}