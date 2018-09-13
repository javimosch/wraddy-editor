module.exports = app => {
	app.post('/search', app.fn.parseJson, async (req, res) => {
		try {
			let text = (req.body.text || '').toLowerCase();
			text = text.trim().split(' ').filter(t=>!!t)

			let or = text.filter(t => !app.srv.constants.fileTypes.includes(t)).filter(t=>t.length>=4).map(t => {
				return {
					name: new RegExp(t, 'i')
				}
			});


			let and = []

			if (or.length > 0) {
				and = [{
					$or: or
				}]
			}

			let t = text.find(t => app.srv.constants.fileTypes.find(ft=>ft.indexOf(t)!==-1))
			if (t) {
				and.push({
					type: new RegExp(t, 'i')
				})
			}

			var conditions = {
				$and: and
			};

			if (req.body.project) {
				let files = (await app.mongoose.model('project').findById(req.body.project).select('files').exec()).files
				conditions._id = {
					$in: files
				}
			}

			if (req.user.type !== 'root') {

			}


			let list = await app.mongoose.model('file').find(conditions).select('_id name type').exec();
			res.status(200).json(list);
		} catch (err) {
			res.handleApiError(err)
		}
	})
}