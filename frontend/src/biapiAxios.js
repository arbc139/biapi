import axios from 'axios';

import store from '@/state/store';
import { SET_LOADING } from '@/state/actions';

const biapi = axios.create({ baseURL: 'https://genax.tools:5550' });
biapi.interceptors.request.use(
  (conf) => {
    store.commit(SET_LOADING, { loading: true });
    return conf;
  },
  (error) => {
    store.commit(SET_LOADING, { loading: false });
    return Promise.reject(error);
  },
);
biapi.interceptors.response.use(
  (conf) => {
    store.commit(SET_LOADING, { loading: false });
    return conf;
  },
  (error) => {
    store.commit(SET_LOADING, { loading: false });
    return Promise.reject(error);
  },
);

export default biapi;
