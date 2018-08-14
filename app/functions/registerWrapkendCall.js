module.exports = app => socket => {
	socket.on('wrapkendCall', params => {
		(async () => {
			if (!params.id) {
				return console.log('Socket: Incoming ignored (no id)')
			}
			params.p = params.p || {}
			socket.emit('wrapkendCall_' + params.id + '_working')
			var result = {
				err: "NO_IMPLEMENTED"
			}
			try {
				if (!params.k) {
					throw new Error('NO_ALLOWED_INVALID_KEY')
				}

				let pr = await app.mongoose.model('project').findOne({
					privateKey: params.k
				}).exec()
				if (!pr) {
					throw new Error('NO_ALLOWED_PROJECT_NOT_FOUND')
				}
				if (params.n === 'getProjectFilesByType') {
					result = await app.fn.getProjectFilesByType(params.p, pr)
				}
				if (params.n === 'getProject') {
					result = pr.toJSON()
				}
				if (params.n === 'getFileById') {
					result = await app.fn.getFileById(params.p)
				}
			} catch (err) {
				console.error('ERROR', 'Incoming socket fn request', err.stack)
				result = {
					err: err.stack
				}
			}
			try {
				socket.emit('wrapkendCall_' + params.id, result)
			} catch (err) {
				console.error('ERROR', 'When sending socket fn request result', err.stack)
				socket.emit('wrapkendCall_' + params.id, {
					err: err.stack
				})
			}
		})();
	})
}