module.exports = {
	res: (req, res, app) => (name, data = {}) => {
		data.user = req.user || {}
		try {
			data = Object.assign(req.pugContext||{},req.context||{},data)

			if(data._initialState){
				data._initialState.forEach(key=>{
					data.initialState = data.initialState || {}
					data.initialState[key] = data[key];
				})
			}
			
			res.send(app.fn.compileFileWithVars(name, data, req));
		} catch (err) {
			console.log('ERROR', err.stack);
			res.status(500).send(err.stack);
		}
	}
}