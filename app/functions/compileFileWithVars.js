const sander = require('sander')
const pug = require('pug');
const path = require('path')
const VIEWS_BASE_DIR = path.join(process.cwd())
module.exports = app => (filePath, vars = {}, req) => {
	var p = path.join(VIEWS_BASE_DIR, 'views', filePath.replace('.pug', '') + '.pug')
	if (sander.existsSync(p)) {
		return pug.compileFile(p)(vars)
	} else {
		p = path.join(VIEWS_BASE_DIR, 'views/dynamic', filePath.replace('.pug', '') + '.pug')
		if (sander.existsSync(p)) {
			return pug.compileFile(p)(vars)
		} else {
			return `View ${filePath} not found`
		}
	}
}