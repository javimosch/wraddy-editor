module.exports = app => roles => {
	return function(req, res, next) {
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
	}
}