<template>
  <div class="root">
    <md-table
      class="articles-table"
      v-model="indexedDisplayArticles"
      md-card
    >
      <md-table-toolbar class="articles-table-title-toolbar">
        <h1 class="md-title articles-table-title">Search Results</h1>
        <span>total: {{ totalCount }}</span>
      </md-table-toolbar>

      <md-table-empty-state
        :md-label="tableEmptyState.label"
        :md-description="tableEmptyState.description">
      </md-table-empty-state>

      <md-table-row
        class="article-table-row"
        slot="md-table-row"
        slot-scope="{ item }"
        @click.native="() => onArticleClicked(item)"
      >
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
import router from '@/router';

import pagination from '@/components/Pagination';

export default {
  name: 'search-result-paper',
  components: { pagination },
  data() {
    return {
      loading: false,
      finish: false,
      articles: [],
      totalCount: 0,
      defaultPaginationOptions: {
        size: 10,
        page: 1,
      },
      tableEmptyState: {
        label: 'No articles found',
        description: 'Please wait for a second...',
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
          `/search/papers/${this.$route.params.id}/pubmeds`,
          {
            params: {
              start,
              max,
            },
          },
        )
        .then((res) => {
          this.loading = false;
          this.totalCount = _.get(res, 'data.count');
          const articles = _.get(res, 'data.articles');
          if (_.isEmpty(articles)) {
            this.finish = true;
            return;
          }
          this.articles = _.concat(this.articles, articles.uids.map(uid => articles[uid]));
        })
        .catch((error) => {
          this.finish = true;
          this.loading = false;
          this.tableEmptyState = _.defaults(
            {
              description: `Error Message: ${_.get(error, 'response.data.message')}`,
            },
            this.tableEmptyState,
          );
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
    onArticleClicked(item) {
      router.push({
        name: 'Article',
        params: {
          encryptedTerm: this.$route.params.encryptedTerm,
          id: this.$route.params.id,
          pmid: item.uid,
        },
      });
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

.articles-table-title-toolbar {
  display: flex;
  align-items: center;
}

.articles-table-title {
  flex: 1;
}

.article-table-row:hover {
  cursor: pointer;
}
</style>
