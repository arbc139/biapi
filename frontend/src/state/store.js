import Vue from 'vue';
import Vuex from 'vuex';
import { SET_LOADING } from './actions';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    loading: false,
  },
  mutations: {
    [SET_LOADING](state, { loading }) {
      state.loading = loading;
    },
  },
});
