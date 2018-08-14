const mongoose = require('mongoose')
module.exports = app => {
    configureDatabaseUserScheme(mongoose, app)
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
                type: String,
                default: 'normal'
            },
            plan: {
                type: String,
                default: 'community'
            },
            password: {
                type: String
            },
            projects: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'project'
            }],
            organizations: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'organization'
            }]
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
                    return async () => {
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
}