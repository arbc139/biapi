<template>
  <div class="root">
    <md-table
      class="genes-table"
      v-model="indexedDisplayGenes"
      md-card
    >
    <!-- :md-sort="degree"
      :md-sort-type="desc" -->
      <md-table-toolbar class="genes-table-title-toolbar">
        <h1 class="md-title genes-table-title">Related Genes "{{ term }}"</h1>
        <span>total: {{ genes.length }}</span>
      </md-table-toolbar>

      <md-table-empty-state
        :md-label="tableEmptyState.label"
        :md-description="tableEmptyState.description">
      </md-table-empty-state>

      <md-table-row
        class="gene-table-row"
        slot="md-table-row"
        slot-scope="{ item }"
        @click.native="() => onGeneClicked(item)"
      >
        <md-table-cell md-label="Symbol">{{ item.symbol }}</md-table-cell>
        <md-table-cell md-label="HGNC ID">{{ item.hgncId }}</md-table-cell>
        <md-table-cell md-label="Degree">{{ item.degree }}</md-table-cell>
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
import genax from '@/genaxAxios';
import router from '@/router';

import Bus from '@/components/Bus';
import pagination from '@/components/Pagination';
import { base64Decode } from '@/utils';

import store from '@/state/store';
import { SET_LOADING } from '@/state/actions';

const JobStatusType = {
  yet: 'RESULT_STATUS_TYPE_YET',
  running: 'RESULT_STATUS_TYPE_RUNNING',
  done: 'RESULT_STATUS_TYPE_DONE',
};

function getEssayStatus(statusObj) {
  if (_.isUndefined(statusObj)) {
    return JobStatusType.yet;
  }
  const { collect, insert } = statusObj;
  if (_.isUndefined(collect) || _.isUndefined(insert)) {
    return JobStatusType.yet;
  }
  if (collect === 0) {
    return JobStatusType.yet;
  }
  if (insert === 5) {
    return JobStatusType.done;
  }
  return JobStatusType.running;
}

function getConstructionStatus(wekaCode) {
  if (_.isUndefined(wekaCode)) {
    return JobStatusType.yet;
  }
  if (wekaCode === 0) {
    return JobStatusType.yet;
  }
  if (wekaCode === 5) {
    return JobStatusType.done;
  }
  return JobStatusType.running;
}

function getAnalysisStatus(networkCode) {
  if (_.isUndefined(networkCode)) {
    return JobStatusType.yet;
  }
  if (networkCode <= 2) {
    return JobStatusType.yet;
  }
  if (networkCode === 6) {
    return JobStatusType.done;
  }
  return JobStatusType.running;
}

const MethodType = {
  coOccurence: 'RESULT_TABLE_METHOD_TYPE_CO_OCCURENCE',
  coOccurenceSingle: 'RESULT_TABLE_METHOD_TYPE_CO_OCCURENCE_SINGLE',
};

function convertMethodTypeToNetId(methodType) {
  switch (methodType) {
    case MethodType.coOccurence:
      return 3;
    case MethodType.coOccurenceSingle:
      return 4;
    default:
      return -1;
  }
}

export default {
  name: 'search-result-gene',
  components: { pagination },
  mounted() {
    this.startGetJobDataTimer();
    Bus.$on('clear-all', () => {
      clearTimeout(this.fetchJobDataTimerId);
      const netId = convertMethodTypeToNetId(this.methodType);
      this.fetchGeneData(this.job.id, netId);
    });
    store.commit(SET_LOADING, { loading: true });
  },
  watch: {
    statuses(newStatuses) {
      if (_.get(newStatuses, 'essay') === JobStatusType.done &&
        _.get(newStatuses, 'construction') === JobStatusType.done &&
        _.get(newStatuses, 'analysis') === JobStatusType.done) {
        Bus.$emit('clear-all');
      }
    },
  },
  data() {
    return {
      loading: false,
      job: {},
      term: base64Decode(_.get(this.$route.params, 'encryptedTerm')),
      methodType: MethodType.coOccurence,
      genes: [],
      defaultPaginationOptions: {
        size: 10,
        page: 1,
      },
    };
  },
  computed: {
    statuses() {
      return {
        essay: getEssayStatus(
          _.get(this.job, 'statuses.essay.status')),
        construction: getConstructionStatus(
          _.get(this.job, 'statuses.construction.status')),
        analysis: getAnalysisStatus(
          _.get(this.job, 'statuses.analysis.status')),
      };
    },
    isJobAllDone() {
      return _.get(this.statuses, 'essay') === JobStatusType.done &&
          _.get(this.statuses, 'construction') === JobStatusType.done &&
          _.get(this.statuses, 'analysis') === JobStatusType.done;
    },
    tableEmptyState() {
      let description = '';
      if (this.isJobAllDone) {
        description = 'Finished';
      } else if (_.get(this.statuses, 'construction') === JobStatusType.done) {
        description = 'Progress analysis...';
      } else if (_.get(this.statuses, 'essay') === JobStatusType.done) {
        description = 'Progress construction...';
      } else {
        description = 'Progress essay collection...';
      }
      return {
        label: 'Wait for a second',
        description,
      };
    },
    displayGenes() {
      if (!this.isJobAllDone) {
        return [];
      }
      return this.genes.map(gene => ({
        symbol: _.get(gene, 'symbol'),
        hgncId: _.get(gene, 'hgncId'),
        degree: _.get(gene, 'degree'),
        jobId: _.get(gene, 'jobId'),
        jobKey: _.get(gene, 'jobKey'),
      }));
    },
    paginationOptions() {
      return {
        size: this.defaultPaginationOptions.size,
        page: this.defaultPaginationOptions.page,
        total: this.displayGenes.length,
      };
    },
    paginatedDisplayGenes() {
      return _.chunk(this.displayGenes, this.paginationOptions.size);
    },
    indexedDisplayGenes() {
      return _.isEmpty(this.paginatedDisplayGenes)
        ? []
        : this.paginatedDisplayGenes[this.paginationOptions.page - 1];
    },
    currentLastRowIndex() {
      return this.paginationOptions.page * this.paginationOptions.size;
    },
  },
  methods: {
    startGetJobDataTimer() {
      console.log('Firing pull getJobData...'); // eslint-disable-line no-console
      const { jobKey } = this.$route.params;
      this.fetchJobData(jobKey);
      this.fetchJobDataTimerId = _.delay(this.startGetJobDataTimer, 3000);
    },
    fetchJobData(jobKey) {
      if (_.isUndefined(jobKey)) return;
      if (this.loading) return;
      this.loading = true;
      genax.get(`key2ids/${jobKey}`)
        .then((response) => {
          const jobId = _.get(response.data, '[0].J_ID');
          return genax.get(`jobs/${jobId}`);
        })
        .then((response) => {
          const rawJob = _.get(response.data, '[0]');
          this.job = {
            id: rawJob.J_ID,
            key: rawJob.J_KEY,
            query: rawJob.QUERY,
            metricScore: rawJob.MIN_NODE_SUP,
            nodeSize: rawJob.NODE_SIZE,
            isTooSmall: rawJob.TOO_SMALL === 1,
            email: rawJob.EMAIL,
            time: {
              start: rawJob.JOB_START_TIME,
              end: rawJob.JOB_DONE_TIME,
            },
            period: {
              start: rawJob.START_DATE,
              end: rawJob.END_DATE,
            },
            parameters: {
              MIN_SUP: rawJob.MIN_SUP,
              MAX_PVAL: rawJob.MAX_PVAL,
              COOC_EM: rawJob.COOC_EM,
            },
            statuses: {
              essay: {
                status: {
                  collect: rawJob.PMID_COLLECT,
                  insert: rawJob.DO_PMID_INSERT,
                },
                instructions: {
                  pmidCount: rawJob.PMID_COUNT,
                },
              },
              construction: {
                status: rawJob.WEKA,
                instructions: {
                  associationEdgeCount: rawJob.EDGE_NUM_ASSO,
                  coOccurenceEdgeCount: rawJob.EDGE_NUM_COOC,
                  singleOccurNodeCount: rawJob.SINGLE_OCCUR_NODE,
                },
              },
              analysis: {
                status: rawJob.NETWORK,
                instructions: {
                  associationGeneCount: rawJob.GENE_NUM_ASSO,
                  associationNodeTotalCount: rawJob.GENE_NUM_ASSO_NODE,
                  coOccurenceGeneCount: rawJob.GENE_NUM_COOC,
                  coOccurenceNodeTotalCount: rawJob.GENE_NUM_COOC_NODE,
                },
              },
            },
          };
          this.loading = false;
        });
    },
    fetchGeneData(jobId, netId) {
      if (_.isUndefined(jobId) || _.isUndefined(netId)) return;
      if (this.loading) return;
      this.loading = true;
      genax.get(`gene_scores/${jobId}/${netId}`)
        .then((response) => {
          const rawGenes = response.data;
          this.genes = _.chain(rawGenes)
            .map(gene => ({
              jobId: gene.J_ID,
              jobKey: this.job.key,
              netId: gene.NET_ID,
              hgncId: gene.HGNC_ID,
              symbol: gene.SYMBOL,
              degree: _.ceil(gene.Degree, 6),
              betweenness: _.ceil(gene.Betweenness, 6),
              closeness: _.ceil(gene.Closeness, 6),
              clusteringCoef: _.ceil(gene.ClusteringCoef, 6),
              eigenVector: _.ceil(gene.Eigenvector, 6),
              katz: _.ceil(gene.Katz, 6),
            }))
            .value();
          this.loading = false;
          store.commit(SET_LOADING, { loading: false });
        });
    },
    onPaginationSizeChanged(size) {
      this.defaultPaginationOptions = _.defaults({ size }, this.defaultPaginationOptions);
    },
    onPaginationPageChanged(page) {
      this.defaultPaginationOptions = _.defaults({ page }, this.defaultPaginationOptions);
    },
    onGeneClicked(item) {
      // window.open(
      //   `https://www.genenames.org/cgi-bin/gene_symbol_report?hgnc_id=HGNC:${item.hgncId}`,
      //   '_blank',
      // );
      // :encryptedTerm/:jobKey/:jobId/:hgncId
      router.push({
        name: 'Gene',
        params: {
          encryptedTerm: this.$route.params.encryptedTerm,
          jobKey: item.jobKey,
          jobId: item.jobId,
          hgncId: item.hgncId,
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

.genes-table {
  margin: 16px;
}

.genes-table-title-toolbar {
  display: flex;
  align-items: center;
}

.genes-table-title {
  flex: 1;
}

.gene-table-row:hover {
  cursor: pointer;
}
</style>
