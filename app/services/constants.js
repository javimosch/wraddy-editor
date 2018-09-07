module.exports = async app => {
	var self = {
		fileTypes: ['javascript', 'function', 'middleware', 'pug', 'route', 'markdown', 'css', 'service', 'schema']
	}

	if(process.env.NODE_ENV === 'production'){
		self.WRAPKEND_API = 'http://178.128.254.49:8084'
		self.WRAPKEND_IP = '178.128.254.49'
	}else{
		self.WRAPKEND_API = 'http://wedev.local:8084'
		self.WRAPKEND_IP = 'localhost'
	}

	return self;
}