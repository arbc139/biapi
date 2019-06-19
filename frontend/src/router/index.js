import Vue from 'vue';
import Router from 'vue-router';

import Article from '@/pages/Article';
import Gene from '@/pages/Gene';
import Patent from '@/pages/Patent';
import Search from '@/pages/Search';
import SearchResultGene from '@/pages/SearchResultGene';
import SearchResultPaper from '@/pages/SearchResultPaper';
import SearchResultPatent from '@/pages/SearchResultPatent';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Search',
      component: Search,
    },
    {
      path: '/searchresult/papers/:encryptedTerm/id/:id',
      name: 'SearchResultPaper',
      component: SearchResultPaper,
    },
    {
      path: '/searchresult/papers/:encryptedTerm/id/:id/articles/:pmid',
      name: 'Article',
      component: Article,
    },
    {
      path: '/searchresult/patents/:encryptedTerm',
      name: 'SearchResultPatent',
      component: SearchResultPatent,
    },
    {
      path: '/searchresult/patents/:encryptedTerm/:patentNumber',
      name: 'Patent',
      component: Patent,
    },
    {
      path: '/searchresult/genes/:encryptedTerm/:jobKey',
      name: 'SearchResultGene',
      component: SearchResultGene,
    },
    {
      path: '/searchresult/genes/:encryptedTerm/:jobKey/:jobId/:hgncId',
      name: 'Gene',
      component: Gene,
    },
  ],
});
