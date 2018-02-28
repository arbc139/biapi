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
      :key="condition.id">
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
    <md-button class="search-button" @click="onClickSearch">Search</md-button>
  </div>
</template>

<script>
import _ from 'lodash';
import biapi from '@/biapiAxios';
import router from '@/router';

import queryCondition from '@/components/QueryCondition';
import { Condition } from '@/structures/QueryConditionObject';

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
    onClickSearch() {
      biapi
        .post(
          '/search',
          { term: this.query },
        )
        .then((res) => {
          router.push({
            name: 'SearchResult',
            params: {
              id: _.get(res, 'data.id'),
            },
          });
        })
        // TODO(dykim): Error message를 ErrorPage에서 보여주도록 처리해야함.
        .catch(error => error);
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
