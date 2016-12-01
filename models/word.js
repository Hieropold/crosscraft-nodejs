'use strict';

var Promise = require('bluebird');

var db = require(__dirname + '/db.js');

module.exports.getRandomWord = getRandomWord;
module.exports.attachCluesList = attachCluesList;
module.exports.getClueById = getClueById;
module.exports.getWordById = getWordById;

function getClueById(id) {
    return db.query('SELECT * FROM clues WHERE cid = ?', [id])
        .then(function (rows) {
            if (rows.length === 0) {
                return false;
            }

            return rows[0];
        });
}

function getWordById(id) {
    return db.query('SELECT * FROM words WHERE wid = ?', [id])
        .then(function (rows) {
            if (rows.length === 0) {
                return false;
            }

            return rows[0];
        });
}

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
    return db.query('SELECT FLOOR(RAND() * COUNT(*)) AS offset FROM words')
        .then(function (rows) {
            return rows[0].offset;
        });
}

function getWordByOffset(offset) {
    return db.query('SELECT * FROM words LIMIT ?, 1', [offset])
        .then(function (rows) {
            return rows[0];
        });
}

function calcCluesCount() {
    return db.query('SELECT COUNT(*) AS total FROM clues')
        .then(function (rows) {
            return rows[0].total;
        });
}

function getClueByWordId(wordId) {
    return db.query('SELECT cid, clue FROM clues WHERE wid = ?', [wordId])
        .then(function (rows) {
            return rows[0];
        });
}

function getRandomClue(totalClues) {
    var randomOffset = parseInt(Math.random() * totalClues);
    return db.query('SELECT cid, clue FROM clues LIMIT ?, 1', [randomOffset])
        .then(function (rows) {
            return rows[0];
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