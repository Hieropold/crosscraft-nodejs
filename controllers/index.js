'use strict';

var log = require('npmlog');
var config = require('config');

module.exports.create = create;

function create(app, preproc) {
    app.get('/', function (req, res) {
        var templateVars = {};
        if (!req.session.isHuman) {
            log.info('app', 'Challenging if human.');
            templateVars.recaptchaForm = {recatpchaSiteKey: config.get('recaptcha.siteKey')};
        }

        res.render('pages/welcome', templateVars);
    });
}