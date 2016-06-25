module.exports = function(express, app, passport, config) {
    var path = require('path');
    var router = express.Router();
    router.get('/', function(req, res, next) {
        res.sendfile('../views/index.html');
    })

    function securePages(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.redirect('/');
        }
    }

    router.get('/auth/facebook', passport.authenticate('facebook', {
        scope: ['user_friends']
    }))


    router.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/chatrooms',
        failureRedirect: '/'
    }))

    router.get('/test', securePages, function(req, res, next) {
        res.send({
            title: 'Home',
            user: req.user,
            config: config
        });
    })

    router.get('/chatrooms', securePages, function(req, res, next) {
        console.log("ngressource");
        res.sendfile(path.join(__dirname, '../views', 'home.html'));
        // res.sendfile(path.resolve('../third/views/home.html'));
    })

    router.get('/logout', function(req, res, next) {
        req.logout();
        res.redirect('/');
    })

    //for checking the session
    router.get('/setcolor', function(req, res, next) {
        req.session.favColor = "red";
        res.send('setting favourite clor');
    })

    router.get('/getcolor', function(req, res, next) {
        res.send('faviourste color:' + (req.session.favColor === undefined ? "Not found" : req.session.favColor))
    })

    app.use('/', router);
}