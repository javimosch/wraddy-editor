module.exports = async app => {
	let list = {};
	let self = {
		async prepareProject(pr) {
			if (!pr._id) {
				pr = await app.model('project').findById(pr).select('name').exec()
			}
			return pr;
		},
		async markAsAlive(pr) {
			pr = await self.prepareProject(pr)
			if (!list[pr.name]) {
				var nsp = app.io.of('/' + pr.name);
				nsp.on('connection', function(socket) {
					app.fn.registerWrapkendCall(socket)
					console.log('Child project connected', pr.name);
				});
				list[pr.name] = nsp;
			}
		},
		async emit(pr, name, params) {
			console.log('emit', pr, name)
			pr = await self.prepareProject(pr)
			if (list[pr.name]) {
				console.log('emit:start', pr.name, name)
				list[pr.name].emit(name, params)
				console.log('emit:end', pr.name, name)
				console.log('Project socket emit', pr.name, name)
			} else {
				await self.markAsAlive(pr)
				console.log('emit delay 5000')
				setTimeout(() => self.emit(pr, name, params), 5000)
			}
		}
	}
	return self;
}