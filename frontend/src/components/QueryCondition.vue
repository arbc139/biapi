<template>
  <div class="root">
    <md-field class="type-selector" v-show="showSelector">
      <md-select v-model="value.type">
        <md-option value="NOT">NOT</md-option>
        <md-option value="AND">AND</md-option>
        <md-option value="OR">OR</md-option>
      </md-select>
    </md-field>
    <md-field class="query-container">
      <md-input
        v-model="value.keyword"
        placeholder="Please input conditions..."
        ref="input"
        @keyup.enter.native="onEnterClicked"
      />
    </md-field>

    <md-button class="md-icon-button md-raised md-dense" @click="onButtonClicked">
      <md-icon>{{ conditionMode === 'CONDITION_MODE_ADD' ? 'add' : 'remove' }}</md-icon>
    </md-button>
  </div>
</template>

<script>
import _ from 'lodash';
import { ConditionMode } from '../structures/QueryConditionObject';

export default {
  name: 'QueryCondition',
  props: {
    conditionMode: {
      type: String,
      required: true,
    },
    value: {
      type: Object,
      required: true,
    },
    showSelector: {
      type: Boolean,
    },
  },
  watch: {
    value: {
      handler() {
        this.$emit('updated');
      },
      deep: true,
    },
  },
  mounted() {
    setTimeout(() => {
      const inputElement = _.get(this.$refs, 'input.$el');
      inputElement.focus();
    }, 20);
  },
  methods: {
    onButtonClicked() {
      if (this.conditionMode === ConditionMode.add) {
        this.$emit('add');
      } else {
        this.$emit('remove');
      }
    },
    onEnterClicked() {
      if (this.conditionMode === 'CONDITION_MODE_ADD') {
        this.onButtonClicked();
      }
    },
  },
};
</script>

<style scoped>
.root {
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: center;
  align-items: center;
  padding: 0;
}

.type-selector {
  width: 100px;
  min-width: auto;
  margin-right: 8px;
}

.query-container {
  width: auto;
  flex: 1;
}
</style>
