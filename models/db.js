'use strict';

var log = require('npmlog');
var mysql = require('mysql');

module.exports.init = init;
module.exports.getConnection = getConnection;

var dbConn;

function init(cfg) {
    log.info('db', 'Initializing mysql db connections pool...');
    log.verbose('db', 'DB host: %s', cfg.host);
    dbConn = mysql.createPool(cfg);
    log.info('db', 'Done.');
}

function getConnection() {
    return dbConn;
}