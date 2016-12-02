'use strict';

let log = require('npmlog');
let mysql = require('mysql');

module.exports.init = init;
module.exports.getConnection = getConnection;
module.exports.getPool = getPool;
module.exports.query = query;

let pool;

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

            return resolve(connection);
        });
    });

}

function getPool() {
    return pool;
}

function query(sql, params) {
    let conn;
    return getConnection()
        .then(function (connection) {
            conn = connection;
            return new Promise(function (resolve, reject) {
                conn.query(sql, params, function (err, rows) {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(rows);
                });
            });
        })
        .then(function (rows) {
            conn.release();
            return rows;
        })
        .catch(function (err) {
            conn.release();
        });
}