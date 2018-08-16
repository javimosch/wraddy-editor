module.exports = app => {
    app.get('/testSession1', (req, res) => {
        req.session.foo = 'bar'
        console.log('OK')
        res.send('OK')
    })
    app.get('/testSession2', (req, res) => {
        res.send(req.session.foo)
    })
}