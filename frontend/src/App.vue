<template>
  <div id="app">
    <md-progress-bar
      class="progress-bar"
      v-show="loading"
      md-mode="indeterminate"
    />
    <router-view/>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'App',
  computed: mapState({
    loading: 'loading',
  }),
};
</script>

<style scoped>
.progress-bar {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 3000;
}
</style>
