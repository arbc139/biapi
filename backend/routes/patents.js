const _ = require('lodash');
const express = require('express');

const patentsViewApi = require('../patentsViewApi');
const logger = require('../logger');

const router = express.Router();

const STATUS_OK = 'biapi/router/STATUS_OK';
const STATUS_ERR = 'biapi/router/STATUS_ERR';

router.get('/', (req, res) => {
  const term = _.get(req.query, 'term');
  const start = _.get(req.query, 'start', 0);
  const max = _.get(req.query, 'max', 20);

  patentsViewApi.search(term, start, max)
    .then((result) => {
      res.status(200).send(_.get(result ,'data'));
    })
    .catch((errorMessage) => {
      res.status(404).send({
        status: STATUS_ERR,
        message: errorMessage,
      });
    });
});

router.get('/:id', (req, res) => {
  const id = _.get(req.params, 'id');

  patentsViewApi.fetch(id)
    .then((result) => {
      res.status(200).send(_.get(result, 'data'));
    })
    .catch((errorMessage) => {
      res.status(404).send({
        status: STATUS_ERR,
        message: errorMessage,
      });
    });
});

module.exports = router;
