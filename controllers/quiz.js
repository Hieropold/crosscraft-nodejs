'use strict';

var async = require('async');
var Promise = require('bluebird');
var log = require('npmlog');
var word = require(__dirname + '/../models/word.js');

module.exports.create = create;

function create(app, preproc) {
    app.get('/quiz', preproc, function (req, res) {
        word.getRandomWord()
            .then(function (randomWord) {
                return word.attachCluesList(randomWord);
            })
            .then(function (word) {
                res.render('pages/quiz', {
                    'word': word.word,
                    'wid': word.wid,
                    'clues': word.clues
                });
            })
            .catch(function (err) {
                log.error('app', 'Error: %s', err);
                return res.status(500).send('Internal error');
            });
    });

    app.get('/quiz/answer/:wid/:cid', preproc, function (req, res) {
        var wid = parseInt(req.params.wid);
        var cid = parseInt(req.params.cid);

        db.getConnection(function (err, connection) {
            if (err) {
                log.error('app', 'Error: %s', err);
                return res.status(500).send('Internal error');
            }

            async.parallel({
                    word: function(callback) {
                        connection.query('SELECT * FROM clues WHERE cid = ' + cid, function (err, rows) {
                            if (err) return callback(err);

                            if (rows.length == 0) {
                                return callback('not_found');
                            }

                            return callback(null, rows[0]);
                        });
                    },
                    clue: function(callback) {
                        connection.query('SELECT * FROM words WHERE wid = ' + wid, function (err, rows) {
                            if (err) return callback(err);

                            if (rows.length == 0) {
                                return callback('not_found');
                            }

                            return callback(null, rows[0]);
                        });
                    }
                },
                function(err, results) {
                    if (err && err.toString() == 'not_found') {
                        return res.status(404).send('Not found');
                    }

                    if (err) {
                        log.error('app', 'Error: %s', err);
                        return res.status(500).send('Internal error');
                    }

                    if (results.word.wid && results.clue.wid && results.word.wid == results.clue.wid) {
                        return res.render('pages/success');
                    }
                    return res.render('pages/fail');
                });
        });
    });
}