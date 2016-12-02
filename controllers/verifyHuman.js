'use strict';

let log = require('npmlog');
let config = require('config');
let https = require('https');

function create(app) {
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
}

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

module.exports.create = create;