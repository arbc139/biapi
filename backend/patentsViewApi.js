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
        'patent_number', 'patent_title', 'patent_date', 'inventor_first_name',
        'inventor_last_name',
      ],
    };
    return this._axios.get(URL, { params });
  }

  fetch(patentNumber) {
    const URL = '/query';
    const params = {
      q: { patent_number: patentNumber },
      f: [
        'patent_number', 'patent_title', 'patent_date', 'inventor_first_name',
        'inventor_last_name', 'patent_type', 'patent_abstract',
      ],
    };
    return this._axios.get(URL, { params });
  }
}

module.exports = new PatentsViewAPI();
