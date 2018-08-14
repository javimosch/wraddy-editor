module.exports = app => {
	app.post('/search', app.fn.parseJson, async (req, res) => {
		try {
			let text = (req.body.text || '').toLowerCase();
			var conditions = {
				$or: [{
					name: new RegExp(text, 'i')
				}, {
					type: new RegExp(text, 'i')
				}]
			};

			if(req.body.project){
				let files = (await app.mongoose.model('project').findById(req.body.project).select('files').exec()).files
				conditions._id = {
					$in: files
				}
			}

			let list = await app.mongoose.model('file').find(conditions).select('_id name type').exec();
			res.status(200).json(list);
		} catch (err) {
			res.handleApiError(err)
		}
	})
}