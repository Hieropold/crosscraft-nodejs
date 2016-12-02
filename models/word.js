'use strict';

let Promise = require('bluebird');
let db = require(__dirname + '/db.js');

module.exports.getRandomWord = getRandomWord;
module.exports.getWordById = getWordById;
module.exports.getClueById = getClueById;

class Word {
    constructor(wid, word) {
        this.wid = wid;
        this.word = word;
    }

    attachClues(clues) {
        this.clues = clues;
    }

    isClueCorrect(clue) {
        return this.wid === clue.wid;
    }
}

function getRandomWord() {
    let word;

    return getRandomOffset()
        .then(function (offset) {
            return getWordByOffset(offset);
        })
        .then(function (row) {
            word = new Word(row.wid, row.word);
            return fetchCluesList(word);
        })
        .then(function (clues) {
            word.attachClues(clues);
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

            return new Word(rows[0].wid, rows[0].word);
        });
}

function fetchCluesList(word) {
    return calcCluesCount()
        .then(function (totalClues) {
            let clues = [];
            for (let i = 0; i < 5; i++) {
                clues.push(getRandomClue(totalClues));
            }
            clues.push(getClueByWordId(word.wid));
            return Promise.all(clues);
        })
        .then(function (clues) {
            return shuffleArray(clues);
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
    let randomOffset = parseInt(Math.random() * totalClues);
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
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}