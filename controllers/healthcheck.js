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
            .catch(function (err) {
                log.error('healthcheck', 'DB error: ' + err);
                return res.status(500).send('Internal error');
            });
    });
}

function performHealthCheck() {
    var conn;
    return db.getConnection()
        .then(function (c) {
            conn = c;
            return conn.query('SELECT * FROM clues LIMIT 1');
        })
        .then(function (rows) {
            conn.release();
            if (rows.length === 0) {
                log.error('healthcheck', 'DB empty!');
                return Promise.reject();
            }
        })
        .catch(function (err) {
            return Promise.reject(err);
        });
}

module.exports.create = create;