const _ = require('lodash');
const axios = require('axios');
const changeCaseObject = require('change-case-object');
const config = require('config');
const moment = require('moment');
const xml2json = require('xml2json');

const eutilConfig = config.get('biapi.eutilConfig');

function getField(config, field) {
  return config.has(field) ? config.get(field).toString() : '';
}

// Singleton
class EUtilsAPI {
  constructor() {
    this._axios = axios.create({ baseURL: getField(eutilConfig, 'baseURL') });
    this._config = {
      tool: getField(eutilConfig, 'tool'),
      email: getField(eutilConfig, 'email'),
      database: getField(eutilConfig, 'database'),
      defaultField: getField(eutilConfig, 'defaultField'),
    };
  }

  search(term, retStart, retMax) {
    const URL = '/esearch.fcgi';
    const params = {
      tool: this._config.tool,
      email: this._config.email,
      db: this._config.database,
      field: this._config.defaultField,
      usehistory: 'y',
      retmode: 'json',
      term,
      retstart: retStart,
      retmax: retMax,
      datetype: 'edat',
      sort: 'relevance',
      mindate: moment('1900-01-01').format('YYYY/MM/DD'),
      maxdate: moment().subtract(2, 'months').format('YYYY/MM/DD'),
    };
    return this._axios.get(URL, { params })
      .then(({ data }) => {
        if (_.has(data, 'esearchresult.ERROR')) {
          return Promise.reject(_.get(data, 'esearchresult.ERROR'));
        }

        return _.get(data, 'esearchresult');
      });
  }

  searchWebEnv(webEnv) {
    const URL = '/esearch.fcgi';
    const params = {
      tool: this._config.tool,
      email: this._config.email,
      db: this._config.database,
      usehistory: 'y',
      retmode: 'json',
      webEnv,
      query_key: 1,
    };
    return this._axios.get(URL, { params })
      .then(({ data }) => {
        if (_.has(data, 'esearchresult.ERROR')) {
          return Promise.reject(_.get(data, 'esearchresult.ERROR'));
        }

        return _.get(data, 'esearchresult');
      });
  }

  summary(webEnv, retStart, retMax) {
    const URL = '/esummary.fcgi';
    const params = {
      tool: this._config.tool,
      email: this._config.email,
      db: this._config.database,
      usehistory: 'y',
      retmode: 'json',
      webEnv,
      query_key: 1,
      retstart: retStart,
      retmax: retMax,
    };
    return this._axios.get(URL, { params })
      .then(({ data }) => {
        if (_.has(data, 'esummaryresult')) {
          return Promise.reject(_.get(data, 'esummaryresult[0]'));
        }

        return _.get(data, 'result');
      });
  }

  fetch(webEnv, pubmedId) {
    const URL = '/efetch.fcgi';
    const params = {
      tool: this._config.tool,
      email: this._config.email,
      db: this._config.database,
      usehistory: 'y',
      retmode: 'xml',
      rettype: 'pubmed',
      webEnv,
      query_key: 1,
      id: pubmedId,
    };
    return this._axios.get(URL, { params })
      .then(({ data }) => {
        return xml2json.toJson(data, { object: true });
      })
      .then((jsonData) => {
        const medlineCitation = changeCaseObject.camelCase(_.get(
          jsonData,
          'PubmedArticleSet.PubmedArticle.MedlineCitation',
        ));

        if (_.isUndefined(medlineCitation)) {
          return Promise.reject('Article is not exist');
        }

        return {
          title: _.get(medlineCitation, 'article.articleTitle'),
          abstract: _.get(
            medlineCitation,
            'article.abstract.abstractText',
            'No Abstracts',
          ),
          authors: _.get(
            medlineCitation,
            'article.authorList.author',
            [],
          ),
          articleDate: _.get(medlineCitation, 'article.articleDate'),
        };
      });
  }
}

module.exports = new EUtilsAPI();
