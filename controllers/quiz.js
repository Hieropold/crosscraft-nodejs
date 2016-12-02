'use strict';

let Promise = require('bluebird');
let log = require('npmlog');
let word = require(__dirname + '/../models/word.js');

module.exports.create = create;

function create(app, preproc) {
    app.get('/quiz', preproc, function (req, res) {

        word.getRandomWord()
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
        let wid = parseInt(req.params.wid);
        let cid = parseInt(req.params.cid);

        // Validate params
        if (!wid || !cid) {
            return res.status(404).send('Not found');
        }

        Promise.all([
            word.getWordById(wid),
            word.getClueById(cid)
        ])
            .then(function (data) {
                let word = data[0];
                let clue = data[1];

                if (word === false || clue === false) {
                    return res.status(404).send('Not found');
                }

                if (word.isClueCorrect(clue)) {
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