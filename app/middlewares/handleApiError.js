module.exports = {
	res: (req, res, app) => err => {
		console.error('ERROR','[handleApiError]', err.stack);
		res.status(200).json({
			err: err.stack
		});
	}
}