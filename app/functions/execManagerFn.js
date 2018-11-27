module.exports = app => async data => {
	var result;
	if (data.method === 'get') {
		var rp = app.require('request-promise');
		result = await rp(app.srv.constants.WRAPKEND_API + data.url)
		result = JSON.parse(result);
	} else {
		result = await rp.post({
			method: 'POST',
			uri: app.srv.constants.WRAPKEND_API + data.url,
			body: data.params,
			json: true
		});
	}
	return result;
};