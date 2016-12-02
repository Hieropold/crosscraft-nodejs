'use strict';

let log = require('npmlog');
let config = require('config');

module.exports.create = create;

function create(app, preproc) {
    app.get('/', function (req, res) {
        let templateVars = {};
        if (!req.session.isHuman) {
            log.info('app', 'Challenging if human.');
            templateVars.recaptchaForm = {recatpchaSiteKey: config.get('recaptcha.siteKey')};
        }

        res.render('pages/welcome', templateVars);
    });
}