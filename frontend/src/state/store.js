import Vue from 'vue';
import Vuex from 'vuex';
import { SET_LOADING, SET_QUERY_CONDITION, CLEAR_QUERY_CONDITION } from './actions';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    loading: false,
    queryConditions: [],
  },
  mutations: {
    [SET_LOADING](state, { loading }) {
      state.loading = loading;
    },
    [SET_QUERY_CONDITION](state, { queryConditions }) {
      state.queryConditions = queryConditions;
    },
    [CLEAR_QUERY_CONDITION](state) {
      state.queryConditions = [];
    },
  },
});
