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
        <span class="inline-block">Offset:</span>
        <input class="slider" type="range" min="0" :max="offsetDayRange" v-model.number="offset" @change="onOffsetChanged">
        <button class="btn btn-sm fa fa-plus" @click="changeOffset(1)"></button>
        <button class="btn btn-sm fa fa-minus" @click="changeOffset(-1)"></button>
        <span>{{offsetDayCurrent}}</span>
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
import dayjs from 'dayjs';
import Vue from 'vue';
import LineChart from '~/components/LineChart.vue';
import CountedItem from '~/components/CountedItem.vue';
import FilterDropDown from '~/components/FilterDropDown.vue';
import { getCountSortFunc, clamp, _ } from '@/src/utils';
import { organizeReadings, parseSimplifiedWattageData } from '@/src/wattage.utils';
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
    dateLimits: {min: null, max: null},
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
      const organized = organizeReadings( this.wattageReadings );

      let filtered = this.wattageReadings;

      if(this.filterSerialNumber) {
        filtered = organized.Serial_Number[this.filterSerialNumber];
      }

      if(this.filterDeviceID) {
        filtered = filtered.filter( r => r.Device_ID === this.filterDeviceID);
      }

      return filtered;
    },

    offsetDayCurrent() {
      return dayjs(this.dateLimits.min).add(this.offset, 'day').format('YYYY-MM-DD');
    },

    offsetDayRange() {
      return dayjs(this.dateLimits.max).diff(this.dateLimits.min, 'day');
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
      const { dateLimits, serialNumbers, deviceIds } = filters;

      this.serialNumbers = serialNumbers;
      this.deviceIds = deviceIds;
      this.dateLimits = dateLimits;
    },

    async fetchWattageReadings() {
      if(this.offsetDayCurrent === 'Invalid Date') return;

      if(this.isBusy) return;

      this.isBusy = true;

      const wattageData = await fetch('./api/readings/date/' + this.offsetDayCurrent).then( res => res.json() );
      this.wattageReadings = await parseSimplifiedWattageData( wattageData );

      //Sort the filters for Serial_Number and Device_ID by # of hits [their total numbers in (#) parentheses]
      this.serialNumbers = this.serialNumbers.sort( this._countSortBySerialNumber );
      this.deviceIds = this.deviceIds.sort( this._countSortByDeviceIDs );
      
      this.isBusy = false;
    },

    onLineChartItemRender(item, {x, y}) {
      trace(item, x, y);
    }
  },

  async mounted() {
    //Store a "debounced" copy of the fetch method to avoid spamming requests:
    this._fetchWattageReadings = _.debounce(() => this.fetchWattageReadings(), 100);
    this._countSortBySerialNumber = getCountSortFunc(() => this.wattageReadings, 'Serial_Number');
    this._countSortByDeviceIDs = getCountSortFunc(() => this.wattageReadings, 'Device_ID');
    
    await this.fetchSerialsAndDeviceIDs();
    await this.fetchWattageReadings();
  }
})
</script>
