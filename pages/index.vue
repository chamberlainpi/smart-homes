<template>
  <LineChart :width="300" :height="400"></LineChart>
</template>

<script lang="ts">
import '@/src/extensions';
import Vue from 'vue'
import LineChart from '~/components/LineChart.vue'

export default Vue.extend({
  components: { LineChart },

  methods: {
    getData() {

    }
  },
  
  mounted() {
    trace("MOUNTED APP!");

    
  }
})
</script>
