'use strict';

module.exports.create = create;

function create(app, preproc) {
    app.get('/quiz', preproc, function (req, res) {

        var dbConn = null;

        async.waterfall([
            function connect(callback) {
                db.getConnection(function (err, connection) {
                    if (err) return callback(err);

                    dbConn = connection;
                    return callback(null);
                });
            },
            function randomWordOffset(callback) {
                dbConn.query('SELECT FLOOR(RAND() * COUNT(*)) AS offset FROM words', function (err, rows) {
                    if (err) return callback(err);

                    var randomOffset = rows[0].offset;

                    return callback(null, randomOffset);
                });
            },
            function randomWord(randomOffset, callback) {
                dbConn.query('SELECT * FROM words LIMIT ' + randomOffset + ', 1', function (err, rows) {
                    if (err) return callback(err);

                    var randomWord = rows[0];

                    return callback(null, randomWord);
                });
            },
            function calcCluesCount(randomWord, callback) {
                dbConn.query('SELECT COUNT(*) AS total FROM clues', function (err, rows) {
                    if (err) return callback(err);

                    var totalWords = rows[0].total;

                    return callback(null, randomWord, totalWords);
                });
            },
            function getClues(randomWord, totalWords, callback) {
                async.parallel({
                        correct: function(callback) {
                            dbConn.query('SELECT cid, clue FROM clues WHERE wid = ' + randomWord.wid, function (err, rows) {
                                if (err) return callback(err);

                                var correctClue = rows[0];

                                return callback(null, correctClue);
                            });
                        },
                        incorrect: function(callback) {
                            var incorrectClues = [];
                            for (i = 0; i < 5; i++) {
                                incorrectClues.push(parseInt(Math.random() * totalWords));
                            }

                            async.map(
                                incorrectClues,
                                function (offset, callback) {
                                    dbConn.query('SELECT cid, clue FROM clues LIMIT ' + offset + ', 1', function (err, rows) {
                                        if (err) return callback(err);

                                        var clue = rows[0];

                                        return callback(null, clue);
                                    });
                                },
                                function (err, clues) {
                                    if (err) return callback(err);

                                    return callback(null, clues);
                                }
                            );
                        }
                    },
                    function cluesDone(err, clues) {
                        if (err) return callback(err);

                        // Shuffle correct clue and incorrect ones
                        var shuffledClues = [];
                        shuffledClues.push(clues.correct);
                        shuffledClues = shuffledClues.concat(clues.incorrect);
                        var shuffle = function(array) {
                            for (var i = array.length - 1; i > 0; i--) {
                                var j = Math.floor(Math.random() * (i + 1));
                                var temp = array[i];
                                array[i] = array[j];
                                array[j] = temp;
                            }
                            return array;
                        };
                        shuffledClues = shuffle(shuffledClues);

                        return callback(null, randomWord, shuffledClues);
                    }
                );
            },
        ], function final(err, randomWord, clues) {
            if (dbConn) {
                dbConn.release();
            }

            if (err) {
                log.error('app', 'Error: %s', err);
                return res.status(500).send('Internal error');
            }

            res.render('pages/quiz', {
                'word': randomWord.word,
                'wid': randomWord.wid,
                'clues': clues
            });
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