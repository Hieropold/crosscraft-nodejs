'use strict';

var Promise = require('bluebird');

var db = require(__dirname + '/db.js');

module.exports.getRandomWord = getRandomWord;
module.exports.attachCluesList = attachCluesList;

function getRandomWord() {
    return getRandomOffset()
        .then(function (offset) {
            return getWordByOffset(offset);
        });
}

function attachCluesList(word) {
    return calcCluesCount()
        .then(function (totalClues) {
            var clues = [];
            for (var i = 0; i < 5; i++) {
                clues.push(getRandomClue(totalClues));
            }
            clues.push(getClueByWordId(word.wid));
            return Promise.all(clues);
        })
        .then(function (clues) {
            word.clues = shuffleArray(clues);

            return word;
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

function calcCluesCount() {
    return new Promise(function (resolve, reject) {
        db.getConnection().query('SELECT COUNT(*) AS total FROM clues', function (err, rows) {
            return (err ? reject(err) : resolve(rows[0].total));
        });
    });
}

function getClueByWordId(wordId) {
    return new Promise(function (resolve, reject) {
        db.getConnection().query('SELECT cid, clue FROM clues WHERE wid = ' + wordId, function (err, rows) {
            return (err ? reject(err) : resolve(rows[0]));
        });
    });
}

function getRandomClue(totalClues) {
    var randomOffset = parseInt(Math.random() * totalClues);
    return new Promise(function (resolve, reject) {
        db.getConnection().query('SELECT cid, clue FROM clues LIMIT ' + randomOffset + ', 1', function (err, rows) {
            return (err ? reject(err) : resolve(rows[0]));
        });
    });
}

/**
 * @param {Array }array
 * @returns {Array} - Shuffled array
 * @description Durstenfield shuffle implementation.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}