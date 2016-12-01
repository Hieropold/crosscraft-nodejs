'use strict';

var log = require('npmlog');
var mysql = require('mysql');
var Promise = require('bluebird');

module.exports.init = init;
module.exports.getConnection = getConnection;
module.exports.getPool = getPool;
module.exports.query = query;

var pool;

function init(cfg) {
    log.info('db', 'Initializing mysql db connections pool...');
    log.verbose('db', 'DB host: %s:%s', cfg.host, cfg.port);
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

function query(sql, params) {
    var conn;
    return getConnection()
        .then(function (connection) {
            conn = connection;
            return conn.query(sql, params);
        })
        .then(function (rows) {
            conn.release();
            return rows;
        })
        .catch(function (err) {
            conn.release();
        });
}