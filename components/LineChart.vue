<template>
    <div class="line-chart relative" :style="{width, height}">
        <canvas ref="canvas"></canvas>
        <div ref="spinner-wrapper" class="absolute block inset-0 bg-black bg-opacity-50 centered">
            <i ref="spinner-icon" class="fa fa-circle-notch text-4xl text-white"></i>
        </div>
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
        },
        spinnerWrapper() {
            return this.$refs['spinner-wrapper'];
        },
        spinnerIcon() {
            return this.$refs['spinner-icon'];
        }
    },

    beforeDestroy() {
        if(!this.lineChartLogic) return;
        this.lineChartLogic.destroy();
        this.lineChartLogic = null;
    },

    mounted() {
        this.lineChartLogic = setupLineChart(this);
        const { setupPixiCanvas, updateChart, resizeChart, events } = this.lineChartLogic;

        window.pixi = setupPixiCanvas();

        updateChart();

        this._tweenSpinner = null;
        events.on('busy', () => {
            TweenMax.to(this.spinnerWrapper, 1.0, {alpha: 1});

            if(this._tweenSpinner) this._tweenSpinner.kill();
            this._tweenSpinner = TweenMax.fromTo(this.spinnerIcon, 1.0, {rotation:0}, {rotation: 360, repeat:-1, ease:Linear.easeNone});
        });

        events.on('unbusy', () => {
            setTimeout(() => {
                if(this._tweenSpinner) this._tweenSpinner.kill();
            }, 500);
            TweenMax.to(this.spinnerWrapper, 1.0, {alpha: 0});
        });
        
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