'use strict';

var log = require('npmlog');
var https = require('https');
var Promise = require('bluebird');

var db = require(__dirname + '/../models/db.js');

function create(app) {
    app.get('/healthcheck', function (req, res) {
        log.info('healthcheck', 'healthchek called');
        performHealthCheck()
            .then(function () {
                log.info('healthcheck', 'OK');
                return res.status(200).send('I\'m OK!');
            })
            .catch(function () {
                return res.status(500).send('Internal error');
            });
    });
}

function performHealthCheck() {
    return new Promise(function (resolve, reject) {
        db.getConnection().query('SELECT * FROM clues LIMIT 1', function (err, rows) {
            if (err) {
                log.error('healthcheck', 'DB error!: ' + err);
                return reject(err);
            }

            if (rows.length === 0) {
                log.error('healthcheck', 'DB empty!');
                return reject();
            }

            return resolve();
        });
    });
}

module.exports.create = create;