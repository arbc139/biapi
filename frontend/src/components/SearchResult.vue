<template>
  <div>SearchResult</div>
</template>

<script>
import _ from 'lodash';
import biapi from '@/biapiAxios';

export default {
  name: 'SearchResult',
  data() {
    return {
      articles: [],
    };
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
</style>
