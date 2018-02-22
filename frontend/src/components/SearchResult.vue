<template>
  <div class="root">
    <md-table class="articles-table" v-model="indexedDisplayArticles" md-card>
      <md-table-toolbar>
        <h1 class="md-title">Search Results</h1>
      </md-table-toolbar>

      <md-table-row slot="md-table-row" slot-scope="{ item }">
        <md-table-cell md-label="UID">{{ item.uid }}</md-table-cell>
        <md-table-cell md-label="Date">{{ item.pubDate }}</md-table-cell>
        <md-table-cell md-label="Main Author">{{ item.mainAuthor }}</md-table-cell>
        <md-table-cell md-label="Title">{{ item.title }}</md-table-cell>
      </md-table-row>
      <pagination
        :page="paginationOptions.page"
        :size="paginationOptions.size"
        :total="paginationOptions.total"
        @page="onPaginationPageChanged"
        @size="onPaginationSizeChanged"
      />
    </md-table>
  </div>
</template>

<script>
import _ from 'lodash';
import biapi from '@/biapiAxios';

import pagination from '@/components/Pagination';

export default {
  name: 'search-result',
  components: { pagination },
  data() {
    return {
      loading: false,
      finish: false,
      articles: [],
      defaultPaginationOptions: {
        size: 10,
        page: 1,
      },
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
    paginationOptions() {
      return {
        size: this.defaultPaginationOptions.size,
        page: this.defaultPaginationOptions.page,
        total: this.displayArticles.length,
      };
    },
    paginatedDisplayArticles() {
      return _.chunk(this.displayArticles, this.paginationOptions.size);
    },
    indexedDisplayArticles() {
      return _.isEmpty(this.paginatedDisplayArticles)
        ? []
        : this.paginatedDisplayArticles[this.paginationOptions.page - 1];
    },
    currentLastRowIndex() {
      return this.paginationOptions.page * this.paginationOptions.size;
    },
  },
  created() {
    this.fetchResults();
  },
  methods: {
    fetchResults(start = 0, max = 100) {
      if (this.finish || this.loading) {
        return;
      }

      this.loading = true;
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
          this.loading = false;
          const articles = _.get(res, 'data.articles');
          if (_.isEmpty(articles)) {
            this.finish = true;
            return;
          }
          this.articles = _.concat(this.articles, articles.uids.map(uid => articles[uid]));
        })
        .catch(() => {
          // TODO(dykim): Error message를 ErrorPage에서 보여주도록 처리해야함.
          this.finish = true;
          this.loading = false;
        });
    },
    onPaginationSizeChanged(size) {
      this.defaultPaginationOptions = _.defaults({ size }, this.defaultPaginationOptions);
      this.fetchResultsIfNeeded();
    },
    onPaginationPageChanged(page) {
      this.defaultPaginationOptions = _.defaults({ page }, this.defaultPaginationOptions);
      this.fetchResultsIfNeeded();
    },
    fetchResultsIfNeeded() {
      if (this.currentLastRowIndex < (this.paginationOptions.total * 0.7)) {
        return;
      }
      this.fetchResults(this.paginationOptions.total, 100);
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
