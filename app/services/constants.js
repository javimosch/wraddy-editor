module.exports = async app => {
	var self = {
		fileTypes: ['javascript', 'function', 'middleware', 'pug', 'route', 'markdown', 'css', 'service', 'schema'],
		subdomainsBlacklist:['jobs', 'contact', 'team', 'editor', 'beta', 'dev', 'blog', 'news', 'site', 'hire', 'wrapkend','documentation','official']
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

	self.ERRORS = {
		USER_NOT_FOUND:'The user was not found. Ups.',
		USER_EMAIL_UNMATCH:'The email do not match any user.'
	}

	return self;
}