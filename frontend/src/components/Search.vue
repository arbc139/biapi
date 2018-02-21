<template>
  <div class="root">
    <md-field>
      <label>First query</label>
      <md-input v-model="queries.first"/>
    </md-field>
    <md-field>
      <label>Second query</label>
      <md-input v-model="queries.second"/>
    </md-field>
    <md-button class="search-button" @click="onClickSearch">Search</md-button>
  </div>
</template>

<script>
import _ from 'lodash';
import biapi from '@/biapiAxios';
import router from '@/router';

export default {
  name: 'Search',
  data() {
    return {
      queries: {
        first: '',
        second: '',
      },
    };
  },
  methods: {
    onClickSearch() {
      biapi
        .post(
          '/search',
          {
            query1: this.queries.first,
            query2: this.queries.second,
          },
        )
        .then((res) => {
          if (_.get(res, 'data.status') !== 'biapi/router/STATUS_OK') {
            return Promise.reject(_.get(res, 'data.message'));
          }

          router.push({
            name: 'SearchResult',
            params: {
              id: _.get(res, 'data.id'),
            },
          });
          return Promise.resolve();
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

.search-button {
  width: 128px;
}
</style>
