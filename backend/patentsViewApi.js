const _ = require('lodash');
const axios = require('axios');
const config = require('config');

const patentsViewConfig = config.get('biapi.patentsViewConfig');

function getField(config, field) {
  return config.has(field) ? config.get(field).toString() : '';
}

// Singleton
class PatentsViewAPI {
  constructor() {
    this._axios = axios.create({
      baseURL: getField(patentsViewConfig, 'baseURL'),
    });
  }

  // Context Free Language for term
  // - term = words | (<words | term> op words)
  // - words = word | {word< word>+}
  // - op = AND | OR | NOT

  _parseWords(words) {
    if (_.first(words) === '{' && _.last(words) === '}') {
      return words.substring(1, words.length - 1);
    }
    return words;
  }

  _parseTerm(rawTerm) {
    if (_.first(rawTerm) !== '(' && !_.last(rawTerm) !== ')') {
      return {
        _text_any: { patent_title: this._parseWords(rawTerm) },
      };
    }

    const term = rawTerm.substring(1, rawTerm.length - 1);
    const splittedTerm = _.split(term, ' ');
    const lastOpIndex = _.findLastIndex(
      splittedTerm,
      word => word === 'AND' || word === 'OR' || word === 'NOT');
    const rawFirst = _.chain(splittedTerm)
      .dropRight(splittedTerm.length - lastOpIndex)
      .join(' ')
      .value();
    const [ rawOp, ...rawSecondArr ] = _.drop(splittedTerm, lastOpIndex);
    const rawSecond = _.join(rawSecondArr, ' ');

    const first = this._parseTerm(rawFirst);
    const second = {
      _text_any: { patent_title: this._parseWords(rawSecond) },
    };
    if (rawOp === 'AND') {
      return {
        _and: [ first, second ],
      };
    } else if (rawOp === 'OR') {
      return {
        _or: [ first, second ],
      };
    }

    return {
      _and: [ first, { _not: second } ],
    };
  }

  _translateTermToQueryJson(term) {
    const parsedTerm = this._parseTerm(term);
    if (_.includes(parsedTerm, undefined)) {
      return undefined;
    }

    return JSON.stringify(parsedTerm);
  }

  search(term, retStart, retMax) {
    const URL = '/query';
    const termJson = this._translateTermToQueryJson(term);
    if (_.isUndefined(termJson)) {
      return Promise.reject('Term has invalid format:', term);
    }

    const params = {
      q: termJson,
      o: {
        page: (retStart / retMax) + 1,
        per_page: retMax,
      },
      f: [
        'patent_number', 'patent_title', 'patent_date', 'inventor_last_name',
      ],
    };
    return this._axios.get(URL, { params });
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

module.exports = new PatentsViewAPI();
