<template>
  <div class="root">
    <md-table class="articles-table" v-model="displayArticles" md-card>
      <md-table-toolbar>
        <h1 class="md-title">Search Results</h1>
      </md-table-toolbar>

      <md-table-row slot="md-table-row" slot-scope="{ item }">
        <md-table-cell md-label="UID">{{ item.uid }}</md-table-cell>
        <md-table-cell md-label="Date">{{ item.pubDate }}</md-table-cell>
        <md-table-cell md-label="Main Author">{{ item.mainAuthor }}</md-table-cell>
        <md-table-cell md-label="Title">{{ item.title }}</md-table-cell>
      </md-table-row>
    </md-table>
  </div>
</template>

<script>
import _ from 'lodash';
import biapi from '@/biapiAxios';

export default {
  name: 'search-result',
  data() {
    return {
      articles: [],
    };
  },
  computed: {
    displayArticles() {
      return this.articles.map(article => ({
        uid: _.get(article, 'uid'),
        pubDate: _.get(article, 'pubdate'),
        mainAuthor: _.get(article, 'authors[0].name'),
        title: _.get(article, 'title'),
      }));
    },
  },
  created() {
    this.fetchResults();
  },
  methods: {
    fetchResults(start = 0, max = 30) {
      biapi
        .get(
          `/search/${this.$route.params.id}/pubmed`,
          {
            params: {
              start,
              max,
            },
          },
        )
        .then((res) => {
          const articles = _.get(res, 'data.articles');
          this.articles = articles.uids.map(uid => articles[uid]);
          console.log(this.articles);
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
  width: 100%;
}

.articles-table {
  margin: 16px;
}
</style>
