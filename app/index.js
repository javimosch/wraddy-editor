require('dotenv').config({
    silent: true
});
const express = require('express')
const app = express()
const server = require('http').Server(app);
const io = require('socket.io')(server);
app.io = io
const fs = require('fs');
const PORT = process.env.PORT || 3000;
const path = require('path');
const cors = require('cors')
require('./bootstraps')(app)
require('./functions')(app)
app.fn.connectMongoose();
require('./schemas')(app)
require('./services')(app).then(() => {
    cookieParser = app.requireInstall('cookie-parser')
    app.use(cookieParser())
    require('./middlewares')(app)
    require('./routes')(app)
    app.use('/', express.static(path.join(process.cwd(), 'assets')));
    server.listen(PORT, function() {
        console.log('Listening on http://localhost:' + PORT)
    })
})