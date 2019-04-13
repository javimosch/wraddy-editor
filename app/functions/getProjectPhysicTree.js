const sander = require('sander');
module.exports = app => async function getProjectPhysicTree(p) {
		sander.readdir(path.join(process.cwd(),'instances'));
}