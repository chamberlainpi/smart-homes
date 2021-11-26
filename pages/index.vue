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

      <div id="offset-controls" class="mb-3 flex flex-col gap-2 desk:items-center desk:flex-row">
        <h3 class="inline-block">Offset:</h3>
        
        <div class="offset-buttons flex items-center justify-center gap-2">
          <span class="text-blue-400 whitespace-nowrap w-44 font-mono">{{offsetTimeCurrentFormatted}}</span>
          <button class="btn btn-sm fa fa-plus" @click="changeOffset(1)"></button>
          <button class="btn btn-sm fa fa-minus" @click="changeOffset(-1)"></button>
        </div>

        <input class="slider flex-grow"
            type="range"
            min="0"
            :max="offsetMax"
            v-model.number="offset"
            @change="onOffsetChanged">
      </div>

      <LineChart class="test-mockup border border-gray-300"
        width="100%"
        height="400px"
        :entries="filteredReadings"
        :xBounds="sampleTimeBounds"
        :yBounds="wattageLimits"
        :tooltipStyle="{fontSize: 10, align: 'left'}"
        :xAxis="{
          label: 'Time',
          compareFunc: d => d.DateTime,
          tick: d => cleanDate(d).split('\n').pop(),
          evaluate: d => d==null ? 0 : new Date(d).getTime(),
          evaluateInverse: d => d==null ? null : cleanDate(new Date(d).toISOString()),
          fontSize: 9,
        }"
        :yAxis="{
          label: 'Wattage',
          compareFunc: d => d.Wattage,
          evaluateInverse: d => d.toFixed(2) + 'W',
        }" /> <!-- tickEveryNth: () => '--------------------------', -->
    </div>

  </div>
</template>

<script>
import '@/src/extensions';
import 'vue-select/dist/vue-select.css';
import Vue from 'vue';
import dayjs from 'dayjs';
import CONSTS from '@/src/api.constants';
import LineChart from '@/components/LineChart.vue';
import CountedItem from '@/components/CountedItem.vue';
import FilterDropDown from '@/components/FilterDropDown.vue';
import { getCountSortFunc, clamp, _, queryParams } from '@/src/utils';
import { organizeReadings, parseSimplifiedWattageData, generateMockupData } from '@/src/utils.wattage';

const { OFFSET_TIME_RANGE, OFFSET_TIME_UNIT, SAMPLE_TIME_UNIT, SAMPLE_TIME_RANGE } = CONSTS.WATTAGE_READING;
const usecache = process.browser && 'usecache' in queryParams() ? '' : '?nocache=1';
const fetchCacheAware = url => fetch(url + usecache);

export default Vue.extend({
  components: {
    LineChart,
    CountedItem,
    FilterDropDown,
  },

  data: () => ({
    mockupEntries: [],
    mockupBounds: [],
    wattageReadings: [],
    serialNumbers: [],
    deviceIds: [],
    dateLimits: {min: null, max: null},
    wattageLimits: [0, 5000],
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

    sampleTimeBounds() {
      const sampleStart = this.offsetTimeCurrent;
      if(!sampleStart.isValid()) return [null, null];
      const sampleEnd = sampleStart.add(SAMPLE_TIME_RANGE, SAMPLE_TIME_UNIT);
      return [sampleStart.toISOString(), sampleEnd.toISOString()];
    },

    offsetTimeCurrentFormatted() {
      return this.offsetTimeCurrent.toISOString().replace(/(T|\.000Z)/g, ' ').trim();
    },

    offsetTimeCurrent() {
      var dayMin = dayjs(this.dateLimits.min);
      if(!dayMin.isValid()) return dayjs();
      return dayjs(this.dateLimits.min).add(this.offset * OFFSET_TIME_RANGE, OFFSET_TIME_UNIT);
    },

    offsetMax() {
      if(!this.dateLimits.min) return 0;
      //Get a more granular offset (ex: hour or minutes) that we can scrub the graph through to see the overlaps better:
      const maxDate = dayjs(this.dateLimits.max)
        .subtract(SAMPLE_TIME_RANGE*2, SAMPLE_TIME_UNIT);
      
      return maxDate.diff(this.dateLimits.min, OFFSET_TIME_UNIT) / OFFSET_TIME_RANGE;
    },
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

    async fetchInitialData() {
      const initData = await fetchCacheAware('./api/init-data?nocache').then( res => res.json() );
      const { dateLimits, wattageLimits, serialNumbers, deviceIds } = initData;

      this.serialNumbers = serialNumbers;
      this.deviceIds = deviceIds;
      this.dateLimits = dateLimits;
      this.wattageLimits = [0, parseFloat(wattageLimits.max)];

      trace(' -- initData', prettyJSON(dateLimits));
    },

    async fetchWattageReadings() {
      if(this.isBusy || !this.offsetTimeCurrent.isValid()) return;

      this.isBusy = true;

      const ENDPOINTS = {
        TEST: './api/readings/' + this.offset,
        PROD: './api/readings/date/' + this.offsetTimeCurrent.toISOString()
      };

      const wattageData = await fetchCacheAware(ENDPOINTS.PROD).then( res => res.json() );
      if(wattageData.empty) {
        this.wattageReadings = [];
      } else {
        this.wattageReadings = await parseSimplifiedWattageData( wattageData );
      }

      //Sort the filters for Serial_Number and Device_ID by # of hits [their total numbers in (#) parentheses]
      this.serialNumbers = this.serialNumbers.sort( this._countSortBySerialNumber );
      this.deviceIds = this.deviceIds.sort( this._countSortByDeviceIDs );
      
      this.isBusy = false;
    },

    cleanDate(d) {
      return d.replace('T', '\n').replace(/\.[0-9]*Z/g, '');
    }
  },

  async mounted() {
    const { mockupEntries, mockupBounds } = generateMockupData(100);
    this.mockupEntries = mockupEntries;
    this.mockupBounds = mockupBounds;

    //Store a "debounced" copy of the fetch method to avoid spamming requests:
    this._fetchWattageReadings = _.debounce(() => this.fetchWattageReadings(), 100);
    this._countSortBySerialNumber = getCountSortFunc(() => this.wattageReadings, 'Serial_Number');
    this._countSortByDeviceIDs = getCountSortFunc(() => this.wattageReadings, 'Device_ID');
    
    await this.fetchInitialData();
    await this.fetchWattageReadings();
  }
})

</script>
