
const express = require('express');

const database = require('../database');
const logger = require('../logger');

const router = express.Router();

// (GET) Find all pmid article abstracts
router.get('/', (req, res) => {
  database.query('SELECT ABSTRACT FROM PMID_CONTENT LIMIT 10')
    .catch(err => logger.error(err))
    .then(rows => res.send(rows));
});

module.exports = router;
