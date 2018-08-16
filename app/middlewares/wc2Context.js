module.exports = {
	handler: app => (req, res, next) =>{
		req.context = req.context || {}
		req.context.layout = {
			sidebar: true,
			isMobile: req.isMobile
		}
		next();
	}
}