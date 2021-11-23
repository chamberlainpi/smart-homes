<template>
  <div class="flex flex-row">
    <img src="@/static/icon.png" width="40px">
    <LineChart :width="300" :height="400" :entries="entries"></LineChart>
  </div>
</template>

<script>
import '@/src/extensions';
import Vue from 'vue'
import LineChart from '~/components/LineChart.vue'

export default Vue.extend({
  components: { LineChart },

  data: () => ({
    entries: [],
  }),

  methods: {
    async getData() {
      const wattageReadings = await fetch('./api/wattage/readings').then( res => res.json() );
      trace("Got the data: ", wattageReadings);

      this.entries = wattageReadings;
    }
  },

  mounted() {
    trace("MOUNTED APP!");
    this.getData();
    
  }
})
</script>
