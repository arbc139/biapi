const _ = require('lodash');
const express = require('express');

const base64 = require('../base64');
const eutilsAPI = require('../eutilsApi');
const logger = require('../logger');

const router = express.Router();

const STATUS_OK = 'biapi/router/STATUS_OK';
const STATUS_ERR = 'biapi/router/STATUS_ERR';

/**
 * POST
 * Search with given query words on PubMed Database.
 * Build a term with query1 and query2, and send it to e-util api.
 *
 * request parameters
 * - query1
 * - query2
 *
 * response
 * - RET_OK
 * - RET_ERROR
 */
router.post('/search', (req, res) => {
  const query1 = _.get(req.body, 'query1');
  const query2 = _.get(req.body, 'query2');

  if (_.isUndefined(query1) && _.isUndefined(query2)) {
    res.status(404).send({
      status: STATUS_ERR,
      message: 'Queries is not undefined.',
    });
    return;
  }

  const term = `${query1} AND ${query2}`;

  eutilsAPI.search(term, 0, 20)
    .then((result) => {
      const id = base64.encode(_.get(result, 'webenv'));
      res.status(200).send({
        status: STATUS_OK,
        id,
        result,
      });
    })
    .catch((errorMessage) => {
      res.status(404).send({
        status: STATUS_ERR,
        message: errorMessage,
      });
    });
});

router.get('/search/:id/pubmed', (req, res) => {
  const id = _.get(req.params, 'id');
  const webEnv = base64.decode(id);
  const start = _.get(req.query, 'start', 0);
  const max = _.get(req.query, 'max', 20);

  eutilsAPI.summary(webEnv, start, max)
    .then((result) => {
      res.status(200).send({
        status: STATUS_OK,
        id,
        start,
        max,
        articles: result,
      });
    })
    .catch((errorMessage) => {
      res.status(404).send({
        status: STATUS_ERR,
        message: errorMessage,
      });
    });
});

router.get('/search/:id/pubmed/:pubmedId', (req, res) => {
  const id = _.get(req.params, 'id');
  const webEnv = base64.decode(id);
  const pubmedId = _.get(req.params, 'pubmedId');

  eutilsAPI.fetch(webEnv, pubmedId)
    .then((article) => {
      res.status(200).send({
        status: STATUS_OK,
        id,
        pubmedId,
        article,
      });
    })
    .catch((errorMessage) => {
      res.status(404).send({
        status: STATUS_ERR,
        message: errorMessage,
      });
    });
});

module.exports = router;
