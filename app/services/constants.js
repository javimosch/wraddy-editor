module.exports = async app => {
	var self = {
		fileTypes: ['javascript', 'function', 'middleware', 'pug', 'route', 'markdown', 'css', 'service', 'schema']
	}

	const isProd = self.isProd = process.env.NODE_ENV === 'production'
	self.NODE_ENV = process.env.NODE_ENV || 'development'

	if(isProd){
		self.WRAPKEND_API = 'http://178.128.254.49:8084'
		self.WRAPKEND_IP = '178.128.254.49'
	}else{
		self.WRAPKEND_API = 'http://localhost:8084'
		self.WRAPKEND_IP = 'localhost'
	}

	return self;
}