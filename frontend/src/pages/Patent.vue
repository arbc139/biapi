<template>
  <div class="root">
    <md-card>
      <md-card-header>
        <span class="md-title">Title</span>
      </md-card-header>
      <md-card-content>
        <span class="md-body1">{{ patent.title }}</span>
      </md-card-content>
      <md-divider class="patent-divider" />
      <md-card-header>
        <span class="md-title">Number</span>
      </md-card-header>
      <md-card-content>
        <span class="md-body1">{{ patent.number }}</span>
      </md-card-content>
      <md-divider class="patent-divider" />
      <md-card-header>
        <span class="md-title">Date</span>
      </md-card-header>
      <md-card-content>
        <span class="md-body1">{{ patent.date }}</span>
      </md-card-content>
      <md-divider class="patent-divider" />
      <md-card-header>
        <span class="md-title">Type</span>
      </md-card-header>
      <md-card-content>
        <span class="md-body1">{{ patent.type }}</span>
      </md-card-content>
      <md-divider class="patent-divider" />
      <md-card-header>
        <span class="md-title">Inventors</span>
      </md-card-header>
      <md-card-content>
        <span class="md-body1">{{ inventorsLabel }}</span>
      </md-card-content>
      <md-divider class="patent-divider" />
      <md-card-header>
        <span class="md-title">Abstract</span>
      </md-card-header>
      <md-card-content>
        <span class="md-body1">{{ patent.abstract }}</span>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import _ from 'lodash';
import biapi from '@/biapiAxios';

export default {
  name: 'patent',
  created() {
    this.fetchArticle();
  },
  data() {
    return {
      loading: false,
      patent: {},
    };
  },
  computed: {
    inventorsLabel() {
      return _.chain(this.patent)
        .get('inventors', [])
        .map('fullName')
        .join(', ')
        .value();
    },
  },
  methods: {
    fetchArticle() {
      if (this.loading) {
        return;
      }

      this.loading = true;
      biapi
        .get(`/search/patents/${this.$route.params.patentNumber}`)
        .then((res) => {
          this.loading = false;
          const rawPatent = _.get(res, 'data.patents[0]', {});
          this.patent = {
            number: _.get(rawPatent, 'patent_number'),
            date: _.get(rawPatent, 'patent_date'),
            title: _.get(rawPatent, 'patent_title'),
            type: _.get(rawPatent, 'patent_type'),
            abstract: _.get(rawPatent, 'patent_abstract'),
            inventors: _.get(rawPatent, 'inventors', []).map(inventor => ({
              id: _.get(inventor, 'inventor_key_id'),
              firstName: _.get(inventor, 'inventor_first_name'),
              lastName: _.get(inventor, 'inventor_last_name'),
              fullName: _.join(
                [
                  _.get(inventor, 'inventor_first_name'),
                  _.get(inventor, 'inventor_last_name'),
                ],
                ' ',
              ),
            })),
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

.patent-divider {
  margin-left: 16px;
  margin-right: 16px;
}
</style>
