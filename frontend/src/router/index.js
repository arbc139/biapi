import Vue from 'vue';
import Router from 'vue-router';

import Article from '@/pages/Article';
import Patent from '@/pages/Patent';
import Search from '@/pages/Search';
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
      path: '/searchresult/papers/:id',
      name: 'SearchResultPaper',
      component: SearchResultPaper,
    },
    {
      path: '/searchresult/papers/:id/articles/:pmid',
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
  ],
});
