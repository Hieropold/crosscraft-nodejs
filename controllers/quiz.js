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

        // Validate params
        if (!wid || !cid) {
            return res.status(404).send('Not found');
        }

        Promise.all([
            word.getWordById(wid),
            word.getClueById(cid)
        ])
            .then(function (data) {
                var word = data[0];
                var clue = data[1];

                if (word === false || clue === false) {
                    return res.status(404).send('Not found');
                }

                if (word.wid && clue.wid && word.wid == clue.wid) {
                    return res.render('pages/success');
                }
                return res.render('pages/fail');
            })
            .catch(function (err) {
                log.error('app', 'Error: %s' + err);
                return res.status(500).send('Internal error');
            });
    });
}