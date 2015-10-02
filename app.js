////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*try {
    var settings = common.readConfig();
}
catch (e) {
    logger.error(e.toString());
    exports.shutdown(-1);
}*/

/*var im = null;

if (settings.CODE_COVERAGE) {
    im = require('istanbul-middleware');

    logger.info('Code coverage enabled - ensure this is not production');
    im.hookLoader(__dirname);
} else {
    logger.info('Code coverage disabled');
}*/

var config = require('config');
var log = require('npmlog');
var express = require('express');
var session = require('express-session');
var SessionStore = require('express-mysql-session');
var bodyParser = require('body-parser');
var dust = require('dustjs-linkedin');
var cons = require('consolidate');
var fs = require('fs');
var mysql = require('mysql');
var async = require('async');
var https = require('https');

var app = express();

// Template engine
app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');

// Publicly available assets
app.use(express.static(__dirname + '/public', {redirect: false}));

app.use(bodyParser.urlencoded({ extended: false }));

log.info('app', 'Initializing mysql db connections pool...');
var db = mysql.createPool(config.get('db'));
log.info('app', 'Done.');

log.info('app', 'Initializing mysql session store...');
var sessionStore = new SessionStore({
    useConnectionPooling: true,
}, db);
log.info('app', 'Done.');

log.info('app', 'Initializing express session handler...');
var sessionConfig = config.get('sessions');
sessionConfig.store = sessionStore;
app.use(session(sessionConfig));
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

app.get('/', function (req, res) {
    var templateVars = {};
    if (!req.session.isHuman) {
        log.info('app', 'Challenging if human.');
        templateVars.recaptchaForm = {recatpchaSiteKey: config.get('recaptcha.siteKey')};
    }

    res.render('pages/welcome', templateVars);
});

app.post('/verify-human', function (req, res) {
    var recaptchaToken = req.body['g-recaptcha-response'];
    log.info('app', 'reCaptcha verification: %s', recaptchaToken)
    verifyRecaptcha(recaptchaToken, config.get('recaptcha.secret'), function(success) {
        if (success) {
            log.info('app', 'reCaptcha verification passed.');
            req.session.regenerate(function (){
                req.session.isHuman = true;
                res.redirect('/quiz');
            });
        } else {
            log.info('app', 'reCaptcha verification failed.');
            // TODO Output meaningful error message
            res.redirect('/');
        }
    });
});

app.get('/quiz', restrictAccess, function (req, res) {

    var dbConn = null;

    async.waterfall([
        function connect(callback) {
            db.getConnection(function (err, connection) {
                if (err) return callback(err);

                dbConn = connection;
                return callback(null);
            });
        },
        function randomOffset(callback) {
            dbConn.query('SELECT FLOOR(RAND() * COUNT(*)) AS offset FROM words', function (err, rows) {
                if (err) return callback(err);

                var randomOffset = rows[0].offset;

                return callback(null, randomOffset);
            });
        },
        function randomWord(randomOffset, callback) {
            dbConn.query('SELECT * FROM words LIMIT ' + randomOffset + ', 1', function (err, rows) {
                if (err) return callback(err);

                var randomWord = rows[0];

                return callback(null, randomWord);
            });
        },
        function correctClue(randomWord, callback) {
            dbConn.query('SELECT * FROM clues WHERE wid = ' + randomWord.wid, function (err, rows) {
                if (err) return callback(err);

                var correctClue = rows[0];

                return callback(null, randomWord, correctClue);
            });
        },
        function incorrectClues(randomWord, correctClue, callback) {
            dbConn.query('SELECT COUNT(*) AS total FROM clues', function (err, rows) {
                if (err) return callback(err);

                var cluesCount = rows[0].total;

                for (i = 0; i < 5; i++) {
                    var randomOffset = Math.random(0, cluesCount);
                    log.silly('app', 'Random offset generated: %d', randomOffset);
                }

                return callback(null, randomWord, correctClue);
            });
        }
    ], function final(err, randomWord, correctClue) {
        if (dbConn) {
            dbConn.release();
        }

        if (err) {
            log.error('app', 'Error: %s', err);
            return res.status(500).send('Internal error');
        }

        res.render('pages/quiz', {
            'word': randomWord.word,
            'wid': randomWord.wid,
            'clues': [
                {'cid': correctClue.cid, 'clue': correctClue.clue},
                {'cid': 4, 'clue': 'Ащаща'}
            ]
        });
    });
});

var server = app.listen(8080, function () {
    var host = server.address().address;
    var port = server.address().port;

    log.info('app', 'Crosscraft app listening at http://%s:%s', host, port);
});

function verifyRecaptcha(key, secret, callback) {
    https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + secret + "&response=" + key, function(res) {
        var data = "";
        res.on('data', function (chunk) {
            data += chunk.toString();
        });
        res.on('end', function() {
            try {
                var parsedData = JSON.parse(data);
                log.info('app', parsedData);
                callback(parsedData.success);
            } catch (e) {
                callback(false);
            }
        });
    });
}