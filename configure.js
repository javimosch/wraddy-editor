const argv = require('yargs').argv
const sander = require('sander')
console.log(argv)

var f = sander.readFileSync(process.cwd()+'/docker-compose.yaml.tpl').toString('utf-8')
f = f.replace('__container__', argv.domain.split('.').join('_')).replace('__port__', argv.port)
sander.writeFileSync(process.cwd()+'/docker-compose.yaml',f)


f = sander.readFileSync(process.cwd()+'/env-example').toString('utf-8')
f = f
	.replace('__domain__', argv.domain)
	.replace('__port__', argv.port)
	.replace('__db__', argv.db)
	.replace('__socket__', argv.socket)
	.replace('__project__', argv.project)
sander.writeFileSync(process.cwd()+'/.env',f)