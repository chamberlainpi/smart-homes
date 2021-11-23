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
    uniqSerials: new Set(),
    uniqDeviceIDs: new Set()
  }),

  methods: {
    changeOffset(byAmount) {
      this.offset += byAmount;
      this.fetchWattageReadings();
    },

    onOffsetChanged() {
      this.fetchWattageReadings();
    },

    async fetchWattageReadings() {
      if(this.isBusy) return;

      this.isBusy = true;
      const wattageReadings = await fetch('./api/wattage/readings/' + this.offset).then( res => res.json() );
      
      this.entries = wattageReadings;

      for(var reading of wattageReadings) {
        this.uniqSerials.add( reading.Serial_Number );
        this.uniqDeviceIDs.add( reading.Device_ID );
      }

      trace("Serials:", this.uniqSerials, "Device IDs:", this.uniqDeviceIDs);

      this.isBusy = false;
    }
  },

  mounted() {
    this.fetchWattageReadings();
  }
})
</script>
