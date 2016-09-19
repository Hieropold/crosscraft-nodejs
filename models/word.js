'use strict';

var Promise = require('bluebird');

var db = require(__dirname + '/db.js');

module.exports.getRandomWord = getRandomWord;

function getRandomWord() {
    return getRandomOffset()
        .then(function (offset) {
            return getWordByOffset(offset);
        });
}

function getRandomOffset() {
    return new Promise(function (resolve, reject) {
        db.getConnection().query('SELECT FLOOR(RAND() * COUNT(*)) AS offset FROM words', function (err, rows) {
            return (err ? reject(err) : resolve(rows[0].offset));
        });
    });
}

function getWordByOffset(offset) {
    return new Promise(function (resolve, reject) {
        db.getConnection().query('SELECT * FROM words LIMIT ' + offset + ', 1', function (err, rows) {
            return (err ? reject(err) : resolve(rows[0]));
        });
    });
}