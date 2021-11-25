<template>
    <div class="line-chart" :style="{width, height}">
        <canvas ref="canvas"></canvas>
    </div>
</template>

<script>
import { setupLineChart } from './LineChart.logic';

export default {
    props: {
        width: String,
        height: String,
        entries: Array,
        xAxis: Object,
        yAxis: Object,
        xBounds: Array,
        yBounds: Array,
    },

    data: () => ({
        lineChartLogic: null,
    }),

    computed: {
        canvas() {
            return this.$refs['canvas'];
        }
    },

    beforeDestroy() {
        if(!this.lineChartLogic) return;
        this.lineChartLogic.destroy();
        this.lineChartLogic = null;
    },

    mounted() {
        this.lineChartLogic = setupLineChart(this);
        const { setupPixiCanvas, updateChart, resizeChart } = this.lineChartLogic;

        window.pixi = setupPixiCanvas();

        updateChart();
        
        this.$watch( 'entries', () => updateChart() );
        
        window.addEventListener('resize', resizeChart);
        this.$once('hook:beforeDestroy', () => {
            window.removeEventListener('resize', resizeChart);
        });

        resizeChart();
    },
}
</script>

<style>
.line-chart {
    border: solid 1px pink;
    overflow: hidden;
}
</style>