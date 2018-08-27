module.exports = app => async function(p) {
	var m = require('mongoose')
	const {
		project
	} = p
	if (project === 'new') return null
	let pr = await m.model('project').findById(project).exec()
	if(pr){
		pr.isCore = true;
	}else{
		pr = await m.model('project').findById(project).exec()
		if(pr){
			pr.isCore=false
			
			var core = await m.model('project').findOne({
				name:pr.name
			}).exec()
			if(core){
				pr.files = core.files;	
			}
		}
	}
	
	
	if(pr){
		pr = await pr.populate('files').execPopulate()
	}

	var types = app.srv.constants.fileTypes
	pr.files.forEach(f => {
		if (!types.includes(f.type)) {
			types.push(f.type)
		}
	})

	var typeChilds = (t) => pr.files.filter(f => f.type == t).map(f => {
		return {
			name: f.name,
			_id: f._id,
			type: f.type,
			_type: 'file'
		}
	})

	var typesChildrens = () => types.map(t => ({
		_id: t,
		name: t,
		_type: 'folder',
		opened: true,
		children: typeChilds(t)
	}))

	return {
		_id: pr._id,
		name: pr.name,
		_type: 'folder',
		opened: true,
		children: typesChildrens()
	}
}