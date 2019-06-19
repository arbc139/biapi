<template>
  <div class="root">
    <md-card>
      <md-card-header>
        <span class="md-title">Gene</span>
      </md-card-header>
      <md-card-content>
        <span class="md-body1">{{ gene.symbol }}</span>
      </md-card-content>
      <md-divider class="gene-divider" />
      <md-card-header>
        <span class="md-title">HGNC ID</span>
      </md-card-header>
      <md-card-content>
        <a
          class="md-body1 a-tag-hover"
          target="_blank"
          :href="`https://www.genenames.org/cgi-bin/gene_symbol_report?hgnc_id=HGNC:${gene.hgncId}`"
        >
          {{ gene.hgncId }}
        </a>
      </md-card-content>
      <md-divider class="gene-divider" />
      <md-card-content>
        <md-table
          class="references-table"
          v-model="indexedDisplayRefs"
          md-card
        >
          <md-table-toolbar class="references-table-title-toolbar">
            <h1 class="md-title references-table-title">
              Reference Articles
            </h1>
            <span>total: {{ gene.referencesTotalCount }}</span>
          </md-table-toolbar>

          <md-table-empty-state md-label="Empty References" />
          <md-table-row
            class="reference-table-row"
            slot="md-table-row"
            slot-scope="{ item }"
            @click.native="() => onReferenceClicked(item)"
          >
            <md-table-cell md-label="PMID">{{ item.pmid }}</md-table-cell>
            <md-table-cell md-label="Title">{{ item.title }}</md-table-cell>
            <!-- <md-table-cell md-label="Title" v-if="!_.isString(item.title)">
              <text-highlight :queries="keywords">
                {{ item.title }}
              </text-highlight>
            </md-table-cell> -->
          </md-table-row>
          <pagination
            :page="paginationOptions.page"
            :size="paginationOptions.size"
            :total="paginationOptions.total"
            @page="onPaginationPageChanged"
            @size="onPaginationSizeChanged"
          />
        </md-table>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import _ from 'lodash';

import genax from '@/genaxAxios';

import pagination from '@/components/Pagination';
import { base64Decode } from '@/utils';

export default {
  name: 'gene',
  components: { pagination },
  beforeCreate() {
    this._ = _;
  },
  created() {
    this.fetchGene(0, this.fetchSize);
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
      keywords,
      gene: {},
      defaultPaginationOptions: {
        size: 10,
        page: 1,
      },
      fetchSize: 100,
    };
  },
  computed: {
    paginationOptions() {
      return {
        size: this.defaultPaginationOptions.size,
        page: this.defaultPaginationOptions.page,
        total: _.get(this.gene, 'references', []).length,
      };
    },
    paginatedDisplayRefs() {
      const references = _.get(this.gene, 'references', []);
      return _.chunk(references, this.paginationOptions.size);
    },
    indexedDisplayRefs() {
      return _.isEmpty(this.paginatedDisplayRefs)
        ? []
        : this.paginatedDisplayRefs[this.paginationOptions.page - 1];
    },
    currentLastRowIndex() {
      return this.paginationOptions.page * this.paginationOptions.size;
    },
  },
  methods: {
    fetchGene(start, size) {
      const { jobId, hgncId } = this.$route.params;
      if (this.loading) return;
      this.loading = true;
      Promise
        .all([
          genax.get(`hgnc2symbols/${hgncId}`),
          genax.get(`gene_pmid_counts/${jobId}/${hgncId}`),
          genax.get(`gene_pmid_titles/${jobId}/${hgncId}/${start}/${size}`),
        ])
        .then(([symbolRes, countRes, titleRes]) => {
          const rawSymbol = symbolRes.data;
          const rawCount = countRes.data;
          const rawTitles = titleRes.data;
          this.gene = {
            symbol: _.get(rawSymbol, '[0].SYMBOL'),
            hgncId,
            referencesTotalCount: _.get(rawCount, '[0].COUNT(*)'),
            references: _.map(rawTitles, rawTitle => ({
              pmid: _.get(rawTitle, 'PMID'),
              title: _.get(rawTitle, 'TITLE'),
            })),
          };
          this.loading = false;
        })
        .catch((error) => {
          // TODO(dykim): Error page로 이동해야함.
          this.loading = false;
          return Promise.reject(error);
        });
    },
    fetchReferences(start, size) {
      const { jobId, hgncId } = this.$route.params;
      if (this.loading) return;
      this.loading = true;
      genax
        .get(`gene_pmid_titles/${jobId}/${hgncId}/${start}/${size}`)
        .then((titleRes) => {
          const rawTitles = titleRes.data;
          this.gene = _.defaults({
            references: _.concat(
              _.get(this.gene, 'references'),
              _.map(rawTitles, rawTitle => ({
                pmid: _.get(rawTitle, 'PMID'),
                title: _.get(rawTitle, 'TITLE'),
              }))),
          }, this.gene);
          this.loading = false;
        })
        .catch((error) => {
          // TODO(dykim): Error page로 이동해야함.
          this.loading = false;
          return Promise.reject(error);
        });
    },
    fetchReferencesIfNeeded() {
      if (this.currentLastRowIndex < (this.paginationOptions.total * 0.7)) {
        return;
      }
      this.fetchReferences(this.paginationOptions.total, this.fetchSize);
    },
    onPaginationSizeChanged(size) {
      this.defaultPaginationOptions = _.defaults({ size }, this.defaultPaginationOptions);
      this.fetchReferencesIfNeeded();
    },
    onPaginationPageChanged(page) {
      this.defaultPaginationOptions = _.defaults({ page }, this.defaultPaginationOptions);
      this.fetchReferencesIfNeeded();
    },
    onReferenceClicked(item) {
      window.open(
        `https://www.ncbi.nlm.nih.gov/pubmed/?term=${item.pmid}`,
        '_blank',
      );
    },
    // highlight() {
    //   return `<text-highlight :queries=keywords>
    //     {{ item.title }}
    //   </text-highlight>`;
    //   // const highlighter = new TextHighlightClass({
    //   //   propsData: {
    //   //     queries: keywords,
    //   //   },
    //   // });
    //   // highlighter.$slots.default = [label];
    //   // highlighter.$mount();
    //   // console.log(highlighter);
    //   // console.log(highlighter.$el);
    //   // return highlighter.$el;
    //   // return `${keywords} ${label}`;
    //   // console.log(highlighter, TextHighlight);
    //   // highlighter.queries = keywords;
    //   // return highlighter.render(label);
    // },
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

.gene-divider {
  margin-left: 16px;
  margin-right: 16px;
}

.references-table {
  margin: 16px;
}

.references-table-title-toolbar {
  display: flex;
  align-items: center;
}

.references-table-title {
  flex: 1;
}

.reference-table-row:hover {
  cursor: pointer;
}
</style>
