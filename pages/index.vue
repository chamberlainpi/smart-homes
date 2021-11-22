<template>
  <LineChart></LineChart>
</template>

<script lang="ts">
import '@/src/extensions';
import Vue from 'vue'
import LineChart from '~/components/LineChart.vue'

trace("Hello World!");

export default Vue.extend({ components: { LineChart } })
</script>
