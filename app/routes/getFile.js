module.exports = app => {
	app.post('/getFile', app.fn.parseJson, async (req, res) => {
		try {
			let _id = req.body._id;
			let single = await app.mongoose.model('file').findOne({
				_id
			}).select('_id name type code').exec();
			res.status(200).json(single);
		} catch (err) {
			res.handleApiError(err)
		}
	})
}