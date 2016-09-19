'use strict';

var log = require('npmlog');
var mysql = require('mysql');

module.exports.init = init;
module.exports.getConnection = getConnection;

var dbConn;

function init(cfg) {
    log.info('app', 'Initializing mysql db connections pool...');
    dbConn = mysql.createPool(cfg);
    log.info('app', 'Done.');
}

function getConnection() {
    return dbConn;
}