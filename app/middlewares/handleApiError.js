module.exports = {
	res: (req, res, app) => err => {
		console.error('ERROR', err.stack);
		res.status(200).json({
			err: err.stack
		});
	}
}