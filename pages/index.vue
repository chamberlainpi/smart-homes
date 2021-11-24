<template>
  <div id="main-wrapper" class="flex flex-col">
    <div id="header-bar" class="hbox bg-gray-400">
      <img src="@/static/icon.png" class="h-10">
      <h1 class="text-shadow-sm text-shadow-white D">Smart-Homes: <i class="font-normal whitespace-nowrap">Wattage Readings</i></h1>
    </div>
    
    <div id="content-wrapper" class="p-2">
      <div id="filter-controls" class="mb-3 grid grid-cols-1 desk:grid-cols-3 gap-3">
        <h3 class="hbox">Filters:
          <button class="btn whitespace-nowrap text-sm"
            v-show="isUsingFilters"
            @click="onClearFilters"><i class="fa fa-times mr-2"></i>Clear Filters</button>
        </h3>

        <FilterDropDown label="Serial Number:" countField="Serial_Number"
          :countInArray="wattageReadings" :options="serialNumbers" v-model="filterSerialNumber" />

        <FilterDropDown label="Device ID:" countField="Device_ID"
          :countInArray="wattageReadings" :options="deviceIds" v-model="filterDeviceID" />
      </div> 

      <div id="offset-controls" class="mb-3 hbox">
        <label class="inline-block w-24">Offset: {{offset}}</label>
        <input class="slider" type="range" min="0" max="1000" v-model.number="offset" @change="onOffsetChanged">
        <button class="btn btn-sm fa fa-plus" @click="changeOffset(1)"></button>
        <button class="btn btn-sm fa fa-minus" @click="changeOffset(-1)"></button>
      </div>

      <LineChart class="border border-gray-300"
        width="100%"
        height="400"
        :entries="filteredReadings"
        :itemRenderer="onLineChartItemRender"
        :xAxis="{label: 'Time', compareFunc: d => new Date(d.DateTime) }"
        :yAxis="{label: 'Wattage', compareFunc: d => d.Wattage }">
      </LineChart>
    </div>

  </div>
</template>

<script>
import '@/src/extensions';
import Vue from 'vue';
import LineChart from '~/components/LineChart.vue';
import CountedItem from '~/components/CountedItem.vue';
import FilterDropDown from '~/components/FilterDropDown.vue';
import { getCountSortFunc, clamp, _ } from '@/src/utils';
import 'vue-select/dist/vue-select.css';

export default Vue.extend({
  components: {
    LineChart,
    CountedItem,
    FilterDropDown,
  },

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
    isUsingFilters() {
      this._fetchWattageReadings();
    },
  },

  methods: {
    changeOffset(byAmount) {
      this.offset += byAmount;

      this.offset = clamp(this.offset, 0, 9999);

      this._fetchWattageReadings();
    },

    onOffsetChanged() {
      this._fetchWattageReadings();
    },

    onClearFilters() {
      this.filterSerialNumber = null;
      this.filterDeviceID = null;
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
      const organized = { Serial_Number: {}, Device_ID: {} };

      /**
       * Catalogs all readings into their respective Serial_Number & Device_ID.
       * Example:
       *   organized.Serial_Number.XYZ123[0] == (1 reading)
       */
      _.forOwn(organized, (obj, field) => {
        for(var reading of readings) {
          const value = reading[field];
          if(!(value in obj)) obj[value] = [];
          obj[value].push( reading );
        }
      });

      //Sort the filters for Serial_Number and Device_ID by # of hits [their total numbers in (#) parentheses]
      this.serialNumbers = this.serialNumbers.sort( this._countSortBySerialNumber );
      this.deviceIds = this.deviceIds.sort( this._countSortByDeviceIDs );

      return organized;
    },

    onLineChartItemRender(item, {x, y}) {
      trace(item, x, y);
    }
  },

  mounted() {
    //Store a "debounced" copy of the fetch method to avoid spamming requests:
    this._fetchWattageReadings = _.debounce(() => this.fetchWattageReadings(), 100);
    this._countSortBySerialNumber = getCountSortFunc(this.wattageReadings, 'Serial_Number');
    this._countSortByDeviceIDs = getCountSortFunc(this.wattageReadings, 'Device_ID');
    
    this.fetchSerialsAndDeviceIDs();
    this.fetchWattageReadings();
  }
})
</script>
