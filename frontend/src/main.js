// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import VueMaterial from 'vue-material';
import TextHighlight from 'vue-text-highlight';
import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/default.css';

import App from './App';
import router from './router';
import store from './state/store';

Vue.config.productionTip = false;
Vue.use(VueMaterial);
Vue.component('text-highlight', TextHighlight);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>',
});
