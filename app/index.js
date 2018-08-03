require('dotenv').config({
    silent: true
});
const express = require('express')
const app = express()
const server = require('http').Server(app);
const bodyParser = require('body-parser');
const parseForm = bodyParser.urlencoded({
    limit: '50mb',
    extended: false
})
const parseJson = bodyParser.json({
    limit: '50mb'
})
const _ = require('lodash');
const pug = require('pug');
const fs = require('fs');
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI
const mongoose = require('mongoose');
const path = require('path');
const VIEWS_BASE_DIR = __dirname
const sander = require('sander')
const requireFromString = require('require-from-string');
const cors = require('cors')
var require_install = require('require-install');
app.requireInstall = require_install
mongoose.set('debug', process.env.MONGODB_DEBUG === '0' ? false : true);



function compileFileWithVars(filePath, vars = {}, req) {
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

function configureMiddlewares() {
    cookieParser = app.requireInstall('cookie-parser')
    app.use(cookieParser())
    app.use((req, res, next) => {
        res.sendView = (name, data = {}) => {
            data.user = req.user || {}
            try {
                res.send(compileFileWithVars(name, data, req));
            } catch (err) {
                console.log('ERROR', err.stack);
                res.status(500).send(err.stack);
            }
        }
        next();
    });
    app.use(async(req, res, next) => {
        try {
            if (!req.cookies) {
                console.log('WARN: cookie-parser required')
            }
            let auth = req.cookies && req.cookies.auth
            if (auth) {
                var atob = app.requireInstall('atob')
                auth = atob(auth)
                auth = JSON.parse(auth)
                let doc = await require('mongoose').model('cloud_user').findOne({
                    email: auth.email,
                    password: auth.password
                }).exec()
                if (doc) {
                    console.log('authenticate ok')
                    req.user = doc;
                }
            }
            next()
        } catch (err) {
            console.error(err.stack)
            res.send(err.stack)
        }
    })
}


configureDatabase().then(() => {

    configureMiddlewares()


    app.use(parseJson, (req, res, next) => {
        console.log('REQ', req.method, req.url, Object.keys(req.body).map(k => k + (!req.body ? ':Empty' : '')).join(', '))
        next();
    })

    app.get('/', async(req, res) => {
        if (!req.user) {
            return res.redirect('/login')
        }
        if(!req.query.projectId){
            res.redirect('/projects');
        }
        res.sendView('home', {
            fileTypes: ['javascript', 'function', 'middleware', 'pug', 'route', 'markdown'],
            project: await mongoose.model('project').findById(req.query.projectId).exec()
        })
    })
    app.get('/projects', async(req, res) => {
        if (!req.user) {
            return res.redirect('/login')
        }
        res.sendView('projects', {
            projects: await mongoose.model('project').find({
                users: {
                    $in: [req.user._id]
                }
            }).exec()
        })
    })
    app.get('/project/:id/edit', async(req, res) => {
        if (!req.user) {
            return res.redirect('/login')
        }
        res.sendView('project-details', {
            project: await mongoose.model('project').findById(req.params.id).exec()
        })
    })
    app.get('/login', (req, res) => {
        if (req.user) {
            return res.redirect('/')
        }
        res.sendView('login', {

        })
    })
    app.post('/login', parseJson, async(req, res) => {
        try {
            let doc = await require('mongoose').model('cloud_user').findOne({
                email: req.body.email,
                password: req.body.password
            })
            if (doc) {
                var btoa = app.requireInstall('btoa')
                res.cookie('auth', btoa(JSON.stringify({
                    email: req.body.email,
                    password: req.body.password
                })))
                return res.status(200).send()
            }
            res.json({
                err: "Invalid credentials"
            })
        } catch (err) {
            console.error('ERROR', err.stack)
            res.json({
                err: "Server error"
            })
        }
    })

    app.get('/logout', (req, res) => {
        res.cookie('auth', '')
        res.redirect('/')
    })


    app.post('/search', parseJson, async(req, res) => {
        try {
            let text = (req.body.text || '').toLowerCase();
            let list = await mongoose.model('file').find({
                $or: [
                    { name: new RegExp(text, 'i') },
                    { type: new RegExp(text, 'i') }
                ]
            }).select('_id name type').exec();
            res.status(200).json(list);
        } catch (err) {
            handleError(err, res, true)
        }
    })

    app.post('/getFile', parseJson, async(req, res) => {
        try {
            let _id = req.body._id;
            let single = await mongoose.model('file').findOne({
                _id
            }).select('_id name type code').exec();
            res.status(200).json(single);
        } catch (err) {
            handleError(err, res, true)
        }
    })

    app.post('/saveFile', parseJson, async(req, res) => {
        try {
            if (!req.body._id) {
                delete req.body._id;
            }
            var payload = _.omit(req.body, ['_id', '__v', 'createdAt', 'updatedAt'])
            if (!req.body._id) {
                var d = await mongoose.model('file').create(payload)
                payload._id = d._id
            } else {
                await mongoose.model('file').findOneAndUpdate({
                    _id: req.body._id
                }, payload, {
                    upsert: true
                }).exec();
                payload._id = req.body._id
            }
            res.status(200).json(req.body);
        } catch (err) {
            handleError(err, res, true)
        }
    });

    app.post('/saveProject', parseJson, async(req, res) => {
        try {
            if (!req.body._id) {
                delete req.body._id;
            }
            var payload = _.omit(req.body, ['_id', '__v', 'createdAt', 'updatedAt'])
            if (!req.body._id) {
                var d = await mongoose.model('project').create(payload)
                payload._id = d._id
            } else {
                await mongoose.model('project').findOneAndUpdate({
                    _id: req.body._id
                }, payload, {
                    upsert: true
                }).exec();
                payload._id = req.body._id
            }
            res.status(200).json(req.body);
        } catch (err) {
            handleError(err, res, true)
        }
    });

    app.use('/', express.static(path.join(process.cwd(), 'assets')));

    server.listen(PORT, function() {
        console.log('Listening on http://localhost:' + PORT)
    })

})



function handleError(err, res, isApi, status = 500) {
    console.error('ERROR', err.stack);
    if (isApi) {
        res.status(200).json(err.stack);
    } else {
        res.redirect('/?err=' + err.message)
    }
}


function configureDatabase() {
    return new Promise((resolve, reject) => {
        if (!DB_URI) {
            console.error('DB_URI required')
            process.exit(0)
        }
        mongoose.connect(DB_URI, {
            server: {
                reconnectTries: Number.MAX_VALUE,
                reconnectInterval: 1000
            }
        });

        const schema = new mongoose.Schema({
            name: {
                type: String,
                required: true,
                index: true
            },
            tags: [String],
            type: {
                type: String,
                required: true,
            },
            code: {
                type: String,
                required: true
            }
        }, {
            timestamps: true,
            toObject: {}
        });
        mongoose.model('file', schema);


        mongoose.model('project', new mongoose.Schema({
            name: {
                type: String,
                required: true,
                unique: true,
                index: true
            },
            label: {
                type: String,
            },
            shortText: {
                type: String,
            },
            domain: {
                type: String
            },
            privateKey: {
                type: String,
                index: true
            },
            users: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'cloud_user',
                index: true
            }],
            usersRights: Object,
            files: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'file'
            }],
            description: {
                type: String,
                default: ''
            },
            settings: {
                type: Object,
                default: {}
            },
        }, {
            timestamps: true,
            toObject: {}
        }));

        configureDatabaseUserScheme(mongoose, app)
        resolve();
    })
}

function configureDatabaseUserScheme(mongoose, app) {
    const schema = new mongoose.Schema({
        email: {
            type: String,
            unique: true,
            index: true
        },
        enabled: {
            type: Boolean,
            default: false,
        },
        type: {
            type: "String",
            default: 'normal'
        },
        password: {
            type: String
        }
    }, {
        timestamps: true,
        toObject: {}
    });

    schema.statics.createDefaultAccounts = async function() {
        try {
            var sequential = app.requireInstall('promise-sequential')
            var defaultRoots = ['arancibiajav@gmail.com']
            console.log('createDefaultAccounts')
            await sequential(defaultRoots.map(email => {
                return async() => {
                    console.log('search', email)
                    var doc = await mongoose.model('cloud_user').findOne({
                        email
                    }).exec()
                    if (doc) {
                        doc.password = 'root'
                        doc.enabled = true;
                        doc.type = "root"
                        doc.save()
                    } else {
                        await mongoose.model('cloud_user').create({
                            email,
                            enabled: true,
                            type: "root",
                            password: 'root'
                        })
                    }
                }
            }))
        } catch (err) {
            console.error('ERROR', err.stack)
            return false;
        }
        return true;
    };



    mongoose.model('cloud_user', schema);
}