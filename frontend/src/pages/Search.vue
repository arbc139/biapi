<template>
  <div class="root">
    <div class="query-container">
      <md-field md-clearable>
        <md-input readonly v-model="query" />
      </md-field>
    </div>
    <div
      class="condition-container"
      v-for="(condition, index) in conditions"
      :key="condition.id"
    >
      <query-condition
        :condition-mode="
          index === conditions.length - 1
          ? 'CONDITION_MODE_ADD'
          : 'CONDITION_MODE_REMOVE'
        "
        :show-selector="index !== 0"
        v-model="conditions[index]"
        @add="onAddClicked"
        @remove="() => onRemoveClicked(index)"
        @updated="onUpdateConditions"
      />
    </div>
    <md-button class="search-button" @click="onClickPaperSearch">Paper Search</md-button>
    <md-button class="search-button" @click="onClickPatentSearch">Patent Search</md-button>
    <md-button class="search-button" @click="onClickGeneSearch">Gene Search</md-button>
  </div>
</template>

<script>
import _ from 'lodash';
import moment from 'moment';

import biapi from '@/biapiAxios';
import genax from '@/genaxAxios';
import router from '@/router';

import queryCondition from '@/components/QueryCondition';
import { Condition } from '@/structures/QueryConditionObject';
import { SET_QUERY_CONDITION } from '@/state/actions';
import { base64Encode } from '@/utils';

export default {
  name: 'search',
  components: { queryCondition },
  data() {
    return {
      query: '',
      conditions: [new Condition('', '')],
    };
  },
  watch: {
    query(newQuery) {
      if (!_.isEmpty(newQuery)) {
        return;
      }
      this.conditions = [new Condition('', '')];
    },
  },
  methods: {
    buildQuery(conditions) {
      const parsedConditions = _.chain(conditions)
        .filter(condition => !_.isEmpty(condition.keyword))
        .map((condition) => {
          if (_.includes(condition.keyword, ' ')) {
            return _.defaults({ keyword: `{${condition.keyword}}` }, condition);
          }
          return condition;
        })
        .map((condition, index) => {
          if (index === 0) {
            return `${condition.keyword}`;
          }
          return _.concat(`${condition.type} ${condition.keyword}`, ')').join('');
        })
        .value();
      const prefix = _.times(parsedConditions.length - 1, () => '(').join('');
      return _.concat(prefix, parsedConditions.join(' '))
        .join('');
    },
    onAddClicked() {
      const condition = new Condition('AND', '');
      this.conditions = _.concat(this.conditions, condition);
      this.query = this.buildQuery(this.conditions);
    },
    onRemoveClicked(index) {
      this.conditions.splice(index, 1);
      if (index === 0 && this.conditions.length !== 0) {
        this.conditions = [
          _.defaults({ type: '' }, this.conditions[0]),
          ..._.drop(this.conditions),
        ];
      }
      this.query = this.buildQuery(this.conditions);
    },
    onUpdateConditions() {
      this.query = this.buildQuery(this.conditions);
    },
    onClickPaperSearch() {
      this.$store.commit(SET_QUERY_CONDITION, this.conditions);
      biapi
        .post(
          '/search/papers',
          { term: this.query },
        )
        .then((res) => {
          router.push({
            name: 'SearchResultPaper',
            params: {
              encryptedTerm: base64Encode(this.query),
              id: _.get(res, 'data.id'),
            },
          });
        })
        // TODO(dykim): Error message를 ErrorPage에서 보여주도록 처리해야함.
        .catch(error => error);
    },
    onClickPatentSearch() {
      this.$store.commit(SET_QUERY_CONDITION, this.conditions);
      router.push({
        name: 'SearchResultPatent',
        params: { encryptedTerm: base64Encode(this.query) },
      });
    },
    onClickGeneSearch() {
      this.$store.commit(SET_QUERY_CONDITION, this.conditions);
      /*
        {
          "query":"(prostate AND cancer)",
          "start_date":"2010/01/01",
          "end_date":"2019/06/13",
          "MIN_NODE_SUP":0.001,
          "node_size":0.1,
          "email":"",
          "MIN_SUP":0.0001,
          "MAX_PVAL":0.05,
          "COOC_EM":0,
        }
      */
      const now = moment();
      const baseParameters = {
        start_date: moment(now)
          .subtract(9, 'years')
          .set({ month: 0, date: 1 }),
        end_date: moment().set({
          year: now.get('year'),
          month: now.get('month'),
          date: now.get('date'),
        }),
        MIN_NODE_SUP: 0.001,
        node_size: 0.1,
        email: '',
        MIN_SUP: 0.0001,
        MAX_PVAL: 0.05,
        COOC_EM: 0,
      };
      genax
        .post(
          'job_insert',
          _.defaults({
            query: this.query,
          }, baseParameters),
        )
        .then((response) => {
          const { insertId } = response.data;
          return genax.get(`id2keys/${insertId}`);
        })
        .then((response) => {
          const jobKey = _.get(response.data, '[0].J_KEY');
          router.push({
            name: 'SearchResultGene',
            params: {
              encryptedTerm: base64Encode(this.query),
              jobKey,
            },
          });
        });
    },
  },
};
</script>

<style scoped>
.root {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 50%;
  padding: 16px;
}

.query-container {
  width: 100%;
}

.condition-container {
  width: 100%;
}

.search-button {
  width: 128px;
}
</style>
