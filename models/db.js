'use strict';

var log = require('npmlog');
var mysql = require('mysql');
var Promise = require('bluebird');

module.exports.init = init;
module.exports.getConnection = getConnection;
module.exports.getPool = getPool;

var pool;

function init(cfg) {
    log.info('db', 'Initializing mysql db connections pool...');
    log.verbose('db', 'DB host: %s', cfg.host);
    pool = mysql.createPool(cfg);
    log.info('db', 'Done.');
}

function getConnection() {
    return new Promise(function (resolve, reject) {
        pool.getConnection(function (err, connection) {
            if (err) {
                return reject(err);
            }

            connection.query = Promise.promisify(connection.query);

            return resolve(connection);
        });
    });

}

function getPool() {
    return pool;
}