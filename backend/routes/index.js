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
 * - term
 * - query1 (deprecated)
 * - query2 (deprecated)
 *
 * response
 * - RET_OK
 * - RET_ERROR
 */
router.post('/search', (req, res) => {
  let rawTerm = _.get(req.body, 'term');
  // TODO(totoro): query1, query2를 제거하고 term만 사용하도록 변경해야함
  const query1 = _.get(req.body, 'query1');
  const query2 = _.get(req.body, 'query2');

  if (_.isUndefined(rawTerm) && _.isUndefined(query1) && _.isUndefined(query2)) {
    res.status(404).send({
      status: STATUS_ERR,
      message: 'Queries is not undefined.',
    });
    return;
  }

  if (_.isUndefined(rawTerm)) {
    term = `${query1} AND ${query2}`;
  } else {
    term = _.chain(rawTerm)
      .replace('{', '(')
      .replace('}', ')')
      .value();
  }

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

router.post('/search', (req, res) => {
  let rawTerm = _.get(req.body, 'term');

  if (_.isUndefined(rawTerm)) {
    res.status(404).send({
      status: STATUS_ERR,
      message: 'Queries is not undefined.',
    });
    return;
  }

  term = _.chain(rawTerm)
    .replace('{', '(')
    .replace('}', ')')
    .value();

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

  Promise
    .all([
      eutilsAPI.searchWebEnv(webEnv),
      eutilsAPI.summary(webEnv, start, max)
    ])
    .then(([searchWebEnvResult, summaryResult]) => {
      res.status(200).send({
        status: STATUS_OK,
        id,
        start,
        max,
        count: _.get(searchWebEnvResult ,'count'),
        articles: summaryResult,
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
