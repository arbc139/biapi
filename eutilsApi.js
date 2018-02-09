const _ = require('lodash');
const axios = require('axios');
const config = require('config');

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

  searchTerm(term, retStart, retMax) {
    const URL = '/esearch.fcgi';
    const params = {
      tool: this._config.tool,
      email: this._config.email,
      db: this._config.database,
      usehistory: 'y',
      retmode: 'json',
      term,
      field: this._config.defaultField,
      retstart: retStart,
      retmax: retMax,
    };
    return this._axios.get(URL, { params });
  }

  searchWebEnv(webEnv, retStart, retMax) {
    const URL = '/esearch.fcgi';
    const params = {
      tool: this._config.tool,
      email: this._config.email,
      db: this._config.database,
      usehistory: 'y',
      retmode: 'json',
      query_key: 1,
      webEnv,
      retstart: retStart,
      retmax: retMax,
    };
    return this._axios.get(URL, { params });
  }
}

module.exports = new EUtilsAPI();
