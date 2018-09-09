module.exports = app =>{
	var errorIos = {}
	var self = {
		prepareErrorIo(name){
			if(!errorIos[name]){
				console.log('DEBUG [prepareErrorIo]','/'+name+'errors')
				errorIos[name]  = app.io.of('/'+name+'/errors');
			}
		},
		getErrorIo(name){
			return errorIos[name]
		}
	}
	return self;
}