import Vue from 'vue';
import Router from 'vue-router';

import Article from '@/components/Article';
import Search from '@/components/Search';
import SearchResult from '@/components/SearchResult';

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
