<template>
  <div class="flex flex-row">
    
    <img src="@/static/icon.png" width="40px">

    <div>
      <label>Offset: {{offset}}</label>
      <input class="slider" type="range" min="0" max="1000" v-model.number="offset" @change="onOffsetChanged">
      <button @click="changeOffset(1)">+</button>
      <button @click="changeOffset(-1)">-</button>
    </div>

    <LineChart 
      :width="300"
      :height="400"
      :entries="entries">
    </LineChart>

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
    offset: 0,
    isBusy: false,
  }),

  methods: {
    changeOffset(byAmount) {
      this.offset += byAmount;
      this.fetchWattageReadings();
    },

    onOffsetChanged() {
      this.fetchWattageReadings();
    },

    async fetchSerialsAndDeviceIDs() {
      const filters = await fetch('./api/filters').then( res => res.json() );
      const { serialNumbers, deviceIds } = filters;

      trace("Serials Numbers: ", serialNumbers);
      trace("Device IDs: ", deviceIds);
    },

    async fetchWattageReadings() {
      if(this.isBusy) return;

      this.isBusy = true;
      const wattageReadings = await fetch('./api/readings/' + this.offset).then( res => res.json() );
      
      this.entries = wattageReadings;

      this.isBusy = false;
    }
  },

  mounted() {
    this.fetchSerialsAndDeviceIDs();
    this.fetchWattageReadings();
  }
})
</script>
