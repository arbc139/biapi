<template>
  <div class="root">
    <span>{{ label }}</span>
    <div class="option-selector">
      <md-field v-show="!_.isEmpty(pageOptions)" class="option-selector-field">
        <md-select
          v-model="mutableSize"
          name="pageOption-name"
          id="pageOption-id"
          @md-selected="onSizeChanged"
        >
          <md-option v-for="pageOption in pageOptions" :key="pageOption" :value="pageOption">
            {{ pageOption }}
          </md-option>
        </md-select>
      </md-field>
    </div>
    <span>{{ rangeLabel }}</span>
    <md-button
      class="md-icon-button previous-button"
      :disabled="disablePreviousPageButton"
      @click="onPreviousPageClicked"
    >
      <md-icon>keyboard_arrow_left</md-icon>
    </md-button>
    <md-button
      class="md-icon-button"
      :disabled="disableNextPageButton"
      @click="onNextPageClicked"
    >
      <md-icon>keyboard_arrow_right</md-icon>
    </md-button>
  </div>
</template>

<script>
import _ from 'lodash';

export default {
  name: 'Pagination',
  props: {
    size: {
      type: Number,
      default: 5,
    },
    total: {
      type: Number,
      default: 10,
    },
    page: {
      type: Number,
      default: 1,
    },
    label: {
      type: String,
      default: 'Rows:',
    },
    separator: {
      type: String,
      default: 'of',
    },
    pageOptions: {
      type: Array,
      default: () => [5, 10, 20],
    },
  },
  beforeCreate() {
    this._ = _;
  },
  data() {
    return {
      mutableSize: this.size,
      mutablePage: this.page,
    };
  },
  computed: {
    startRow() {
      return ((this.page - 1) * this.size) + 1;
    },
    endRow() {
      return this.page * this.size;
    },
    rangeLabel() {
      return `${this.startRow} - ${this.endRow} ${this.separator} ${this.total}`;
    },
    disablePreviousPageButton() {
      return this.page === 1;
    },
    disableNextPageButton() {
      return this.endRow >= this.total;
    },
  },
  methods: {
    onSizeChanged(newSize) {
      this.$emit('size', newSize);
    },
    onPreviousPageClicked() {
      if (this.page === 1) {
        return;
      }

      this.$emit('page', this.page - 1);
    },
    onNextPageClicked() {
      this.$emit('page', this.page + 1);
    },
  },
};
</script>

<style scoped>
.root {
  display: flex;
  flex-direction: row;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
  border-top: 1px solid #e0e0e0;
  color: rgba(0, 0, 0, 0.54);
  font-size: 12px;
  height: 56px;
  padding: 16px;
}

.option-selector {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 64px;
  margin: 0 32px;
}

.option-selector-field {
  min-height: 0;
  padding: 0;
  margin: 0;
}

.option-selector-field::after,
.option-selector-field::before {
  height: 0;
}

.previous-button {
  margin-left: 16px;
}
</style>
