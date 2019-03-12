<template>
  <div class="root">
    <md-card>
      <md-card-header>
        <span class="md-title">Title</span>
      </md-card-header>
      <md-card-content>
        <span class="md-body1">
          <text-highlight :queries="keywords" v-if="_.isString(article.title)">
            {{ article.title }}
          </text-highlight>
        </span>
      </md-card-content>
      <md-divider class="article-divider" />
      <md-card-header>
        <span class="md-title">Pubmed ID</span>
      </md-card-header>
      <md-card-content>
        <span class="md-body1">{{ article.pmid }}</span>
      </md-card-content>
      <md-divider class="article-divider" />
      <md-card-header>
        <span class="md-title">Authors</span>
      </md-card-header>
      <md-card-content>
        <span class="md-body1">{{ authorsLabel }}</span>
      </md-card-content>
      <md-divider class="article-divider" />
      <md-card-header>
        <span class="md-title">Abstract</span>
      </md-card-header>
      <md-card-content
        v-if="_.isArray(article.abstracts)"
        v-for="(abstract, index) in article.abstracts"
        :key="index"
      >
        <div class="md-subheading">{{ abstract.label }}</div>
        <span class="md-body1">
          <text-highlight :queries="keywords">
            {{ abstract.t }}
          </text-highlight>
        </span>
      </md-card-content>
      <md-card-content v-if="_.isString(article.abstracts)">
        <span class="md-body1">
          <text-highlight :queries="keywords">
            {{ article.abstracts }}
          </text-highlight>
        </span>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import _ from 'lodash';
import biapi from '@/biapiAxios';

import { base64Decode } from '@/utils';

export default {
  name: 'article',
  beforeCreate() {
    this._ = _;
  },
  created() {
    this.fetchArticle();
  },
  data() {
    const term = base64Decode(this.$route.params.encryptedTerm);
    const keywords = _.chain(term)
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .split(' ')
      .filter(keyword => (
        keyword !== 'AND' && keyword !== 'OR' && keyword !== 'NOT'
      ))
      .value();
    return {
      loading: false,
      article: {},
      keywords,
    };
  },
  computed: {
    authorsLabel() {
      return _.join(_.get(this.article, 'authors', []), ', ');
    },
  },
  methods: {
    fetchArticle() {
      if (this.loading) {
        return;
      }

      this.loading = true;
      biapi
        .get(`/search/papers/${this.$route.params.id}/pubmeds/${this.$route.params.pmid}`)
        .then((res) => {
          this.loading = false;
          const pmid = _.get(res, 'data.pubmedId');
          const articleRaw = _.get(res, 'data.article');
          const authorsRaw = _.get(articleRaw, 'authors', []);
          this.article = {
            pmid,
            title: _.get(articleRaw, 'title', 'No title'),
            authors: _.isArray(authorsRaw)
              ? authorsRaw.map(author => `${_.get(author, 'foreName')} ${_.get(author, 'lastName')}`)
              : [`${_.get(authorsRaw, 'foreName')} ${_.get(authorsRaw, 'lastName')}`],
            abstracts: _.get(articleRaw, 'abstract'),
          };
        })
        .catch((error) => {
          // TODO(dykim): Error page로 이동해야함.
          this.loading = false;
          return Promise.reject(error);
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
  padding: 16px;
}

.article-divider {
  margin-left: 16px;
  margin-right: 16px;
}
</style>
