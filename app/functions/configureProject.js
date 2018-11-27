module.exports = app => async data => {
	var result = await app.fn.execManagerFn({
		url: '/configure-project/' + data.projectId + '?userId=' + data.userId + '&forceRecreate=1',
		method: 'get'
	});
	return result;
};