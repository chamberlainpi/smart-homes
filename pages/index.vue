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
    async getData() {
      const wattageReadings = await fetch('./api/wattage/readings').then( res => res.json() );
      trace("Got the data: ", wattageReadings);
    }
  },

  mounted() {
    trace("MOUNTED APP!");
    this.getData();
    
  }
})
</script>
