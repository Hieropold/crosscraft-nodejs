var config = require('config');
var log = require('npmlog');
var express = require('express');
var bodyParser = require('body-parser');
var dust = require('dustjs-linkedin');
var cons = require('consolidate');
var fs = require('fs');

log.level = 'verbose';

var session = require('express-session');
var SessionStore = require('express-mysql-session')(session);

var db = require(__dirname + '/models/db.js');

// Controllers
var ctrls = [
    require(__dirname + '/controllers/index.js'),
    require(__dirname + '/controllers/verifyHuman.js'),
    require(__dirname + '/controllers/quiz.js'),
    require(__dirname + '/controllers/healthcheck.js')
];

var app = express();

// Template engine
app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');

// Publicly available assets
app.use(express.static(__dirname + '/public', {redirect: false}));

app.use(bodyParser.urlencoded({ extended: false }));

// Initialize DB
db.init(config.get('db'));

// Initialize sessions
log.info('app', 'Initializing mysql session store...');
var sessionStore = new SessionStore({
    useConnectionPooling: true,
}, db.getPool());
log.info('app', 'Done');

log.info('app', 'Initializing express session handler...');
var sessionConfig = config.get('sessions');
sessionConfig.store = sessionStore;
var sessionMiddleware = session(sessionConfig);
app.use(function (req, res, next) {
    // Skip session for healthcheck request
    if (req.originalUrl === '/healthcheck') {
        return next();
    }
    return sessionMiddleware(req, res, next);
});
log.info('app', 'Done.');

function restrictAccess(req, res, next) {
    if (req.session.isHuman) {
        log.info('app', 'CAPTCHA test already passed.');
        next();
    }
    else {
        log.info('app', 'CAPTCHA verification required.');
        res.redirect('/');
    }
}

ctrls.forEach(function (controller) {
    controller.create(app, restrictAccess);
});

var server = app.listen(8080, function () {
    var host = server.address().address;
    var port = server.address().port;

    log.info('app', 'Crosscraft app listening at http://%s:%s', host, port);
});