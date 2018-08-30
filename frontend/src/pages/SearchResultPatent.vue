<template>
  <div class="root">
    <md-table
      class="patents-table"
      v-model="indexedDisplayPatents"
      md-card
    >
      <md-table-toolbar class="patents-table-title-toolbar">
        <h1 class="md-title patents-table-title">Search Results</h1>
        <span>total: {{ totalCount }}</span>
      </md-table-toolbar>

      <md-table-empty-state
        :md-label="tableEmptyState.label"
        :md-description="tableEmptyState.description">
      </md-table-empty-state>

      <md-table-row
        class="patents-table-row"
        slot="md-table-row"
        slot-scope="{ item }"
        @click.native="() => onPatentClicked(item)"
      >
        <md-table-cell md-label="Number">{{ item.number }}</md-table-cell>
        <md-table-cell md-label="Date">{{ item.date }}</md-table-cell>
        <md-table-cell md-label="Main Inventor">{{ item.mainInventor }}</md-table-cell>
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
import { base64Decode } from '@/utils';

export default {
  name: 'search-result-patent',
  components: { pagination },
  data() {
    return {
      loading: false,
      finish: false,
      patents: [],
      totalCount: 0,
      defaultPaginationOptions: {
        size: 10,
        page: 1,
      },
      tableEmptyState: {
        label: 'No patents found',
        description: 'Please wait for a second...',
      },
    };
  },
  computed: {
    displayPatents() {
      return this.patents.map(patent => ({
        number: _.get(patent, 'number'),
        date: _.get(patent, 'date'),
        mainInventor: _.get(patent, 'inventors[0].fullName'),
        title: _.get(patent, 'title'),
      }));
    },
    paginationOptions() {
      return {
        size: this.defaultPaginationOptions.size,
        page: this.defaultPaginationOptions.page,
        total: this.displayPatents.length,
      };
    },
    paginatedDisplayPatents() {
      return _.chunk(this.displayPatents, this.paginationOptions.size);
    },
    indexedDisplayPatents() {
      return _.isEmpty(this.paginatedDisplayPatents)
        ? []
        : this.paginatedDisplayPatents[this.paginationOptions.page - 1];
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
          '/search/patents',
          {
            params: {
              term: base64Decode(this.$route.params.encryptedTerm),
              start,
              max,
            },
          },
        )
        .then((res) => {
          this.loading = false;
          this.totalCount = _.get(res, 'data.total_patent_count');
          const rawPatents = _.get(res, 'data.patents');
          if (_.isEmpty(rawPatents)) {
            this.finish = true;
            return;
          }

          const patents = rawPatents.map(patent => ({
            number: _.get(patent, 'patent_number'),
            date: _.get(patent, 'patent_date'),
            title: _.get(patent, 'patent_title'),
            inventors: _.get(patent, 'inventors', []).map(inventor => ({
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
          }));
          this.patents = _.concat(this.patents, patents);
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
    onPatentClicked(item) {
      router.push({
        name: 'Patent',
        params: {
          encryptedTerm: this.$route.params.encryptedTerm,
          patentNumber: item.number,
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

.patents-table {
  margin: 16px;
}

.patents-table-title-toolbar {
  display: flex;
  align-items: center;
}

.patents-table-title {
  flex: 1;
}

.patents-table-row:hover {
  cursor: pointer;
}
</style>
