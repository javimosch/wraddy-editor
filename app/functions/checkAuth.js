module.exports = app => roles => {
	return function(req, res, next) {
		
		app.fn.parseJson(req, res, async () => {

			let privateKey = req.body.privateKey
			if(privateKey){
				let pr = await app.model('project').findOne({
					privateKey
				}).exec();
				if(pr){
					return next()
				}
			}

			if (req.user) {
				if (roles instanceof Array) {
					if (!roles.includes(req.user.type)) {
						return res.status(401).send();
					}
				}
				if (typeof role === 'string' && role !== req.user.type) {
					return res.status(401).send();
				}
				next();
			} else {
				return res.status(401).send()
			}

		})
	}
}