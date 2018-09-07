const mongoose = require('mongoose')
module.exports = app => async(user, project)=>{
let projectId = project._id ? project._id : project;
	
//	Team.update({_id: team._id}, {$addToSet: {players: player}})
	
	var conditions = {
		_id: user._id,
		'projects._id': {
			$ne: projectId
		}
	};
	let addToSet  = {
			projects: projectId
		}
	var update = {
		$addToSet: addToSet
	}
	console.log('DEBUG','[attachProjectToUser start]',conditions,addToSet)
	return await mongoose.model('cloud_user').findOneAndUpdate(conditions, update)
}