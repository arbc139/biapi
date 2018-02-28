import Vue from 'vue';
import Router from 'vue-router';

import Article from '@/pages/Article';
import Search from '@/pages/Search';
import SearchResult from '@/pages/SearchResult';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Search',
      component: Search,
    },
    {
      path: '/searchresult/:id',
      name: 'SearchResult',
      component: SearchResult,
    },
    {
      path: '/searchresult/:id/articles/:pmid',
      name: 'Article',
      component: Article,
    },
  ],
});
