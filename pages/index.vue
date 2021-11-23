<template>
  <div class="flex flex-row">
    
    <img src="@/static/icon.png" width="40px">

    <div>
      <label>Offset: {{offset}}</label>
      <input class="slider" type="range" min="0" max="1000" v-model.number="offset" @change="onOffsetChanged">
      <button @click="changeOffset(1)">+</button>
      <button @click="changeOffset(-1)">-</button>
    </div>

    <div>
      <h3>Filters:
        <button v-show="isUsingFilters" @click="filterSerialNumber = filterDeviceID = null">Clear Filters</button>
      </h3>
      <span>Serial Number:
        <v-select :options="serialNumbers" v-model="filterSerialNumber">
          <template v-slot:option="serial">
            <CountedItem :count="countReadings(serial.label, 'Serial_Number')" :label="serial.label" />
          </template>
        </v-select>
      </span>
      <span>Device ID:
        <v-select :options="deviceIds" v-model="filterDeviceID">
          <template v-slot:option="device">
            <CountedItem :count="countReadings(device.label, 'Device_ID')" :label="device.label" />
          </template>
        </v-select>
      </span>
    </div>

    <LineChart 
      :width="300"
      :height="400"
      :entries="filteredReadings">
    </LineChart>

  </div>
</template>

<script>
import '@/src/extensions';
import Vue from 'vue';
import LineChart from '~/components/LineChart.vue';
import CountedItem from '~/components/CountedItem.vue';
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';
import _debounce from 'lodash/debounce';
import _forOwn from 'lodash/forOwn';

globalThis.Vue = Vue;

export default Vue.extend({
  components: { LineChart, CountedItem, vSelect },

  data: () => ({
    wattageReadings: [],
    serialNumbers: [],
    deviceIds: [],
    offset: 0,
    filterSerialNumber: null,
    filterDeviceID: null,
    isBusy: false,
  }),

  computed: {
    isUsingFilters() {
      return this.filterDeviceID != null || this.filterSerialNumber != null;
    },

    filteredReadings() {
      const organized = this.organizeReadingsPerDevice( this.wattageReadings );

      let filtered = this.wattageReadings;

      if(this.filterSerialNumber) {
        filtered = organized.Serial_Number[this.filterSerialNumber];
      }

      if(this.filterDeviceID) {
        filtered = filtered.filter( r => r.Device_ID === this.filterDeviceID);
      }

      return filtered;
    }
  },

  watch: {
    filterSerialNumber() {
      this._fetchWattageReadings();
    },

    filterDeviceID() {
      this._fetchWattageReadings();
    },
  },

  methods: {
    countReadings(query, field) {
      return this.wattageReadings.filter( r => r[field] === query ).length;
    },

    changeOffset(byAmount) {
      this.offset += byAmount;

      this.offset = this.offset < 0 ? 0 : (this.offset > 9999 ? 9999 : this.offset);

      this._fetchWattageReadings();
    },

    onOffsetChanged() {
      this._fetchWattageReadings();
    },

    async fetchSerialsAndDeviceIDs() {
      const filters = await fetch('./api/filters').then( res => res.json() );
      const { serialNumbers, deviceIds } = filters;

      this.serialNumbers = serialNumbers;
      this.deviceIds = deviceIds;
    },

    async fetchWattageReadings() {
      if(this.isBusy) return;

      this.isBusy = true;
      
      this.wattageReadings = await fetch('./api/readings/' + this.offset).then( res => res.json() );

      this.isBusy = false;
    },

    organizeReadingsPerDevice( readings ) {
      const organized = {
        Serial_Number: {},
        Device_ID: {},
      }

      _forOwn(organized, (obj, field) => {
        for(var reading of readings) {
          const value = reading[field];
          if(!(value in obj)) obj[value] = [];
          obj[value].push( reading );
        }
      });

      this.serialNumbers = this.serialNumbers.sort( this._countSortBySerialNumber );
      this.deviceIds = this.deviceIds.sort( this._countSortByDeviceIDs );

      return organized;
    },

  },

  mounted() {
    const getCountSortFunc = field => (a, b) => {
      const countA = this.countReadings(a, field);
      const countB = this.countReadings(b, field);
      return countB - countA;
    };
    
    this._countSortBySerialNumber = getCountSortFunc('Serial_Number');
    this._countSortByDeviceIDs = getCountSortFunc('Device_ID');

    this.fetchSerialsAndDeviceIDs();
    this.fetchWattageReadings();

    //Store a "debounced" copy of the fetch method to do updates as needed:
    this._fetchWattageReadings = _debounce(() => this.fetchWattageReadings(), 100);
  }
})
</script>
