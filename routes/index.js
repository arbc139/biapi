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
  const term = `${query1} AND ${query2}`;

  eutilsAPI.searchTerm(term, 0, 20)
    .then(({ data }) => {
      if (_.has(data.esearchresult, 'ERROR')) {
        res.status(404).send({
          status: STATUS_ERR,
          message: data.esearchresult.ERROR,
        });
        return;
      }

      const id = base64.encode(_.get(data, 'esearchresult.webenv'));
      res.status(200).send({
        status: STATUS_OK,
        id,
        result: _.get(data, 'esearchresult'),
      });
    });
});

router.get('/search', (req, res) => {
  const id = _.get(req.query, 'id');
  const webEnv = base64.decode(id);
  console.log(webEnv);

  eutilsAPI.searchWebEnv(webEnv, 0, 20)
    .then(({ data }) => {
      if (_.has(data.esearchresult, 'ERROR')) {
        res.status(404).send({
          status: STATUS_ERR,
          message: data.esearchresult.ERROR,
        });
        return;
      }

      res.status(200).send({
        status: STATUS_OK,
        id,
        result: _.get(data, 'esearchresult'),
      });
    });
});

module.exports = router;
