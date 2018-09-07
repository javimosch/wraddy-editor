module.exports = app => (file, project) => {
	app.managerSocket.emit('saveFile', {
		project: {
			name: project.name,
			privateKey: project.privateKey
		},
		file: {
			_id: file._id,
			name: file.name,
			code: file.code,
			type: file.type,
		}
	})
}