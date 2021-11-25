<template>
    <div class="line-chart" :style="{width, height}">
        <canvas ref="canvas"></canvas>
    </div>
</template>

<script>
import { _, defer } from '@/src/utils';
import { createPixiApp } from '@/src/utils.pixi';

const gap = 30;
const deg2rad = Math.PI / 180;

export default {
    props: {
        width: String,
        height: String,
        entries: Array,
        itemRenderer: Function,
        xAxis: Object,
        yAxis: Object
    },

    data: () => ({
        pixi: null
    }),

    watch: {
        entries() {
            this.updateChart();
        }
    },

    computed: {
        canvas() {
            return this.$refs['canvas'];
        }
    },

    methods: {
        setupPixiCanvas() {
            const { $el } = this;
            this.pixi = createPixiApp({
                view: this.canvas,
                backgroundColor: 0xffffff,
                resizeTo: $el
            });

            this.initGuides();
        },

        clearCanvas() {
            if(!this.pixi) return;
            this.pixi.clear();
        },

        redraw() {
            this.drawGuides();
            this.drawEntries();
        },

        initGuides() {
            const {xAxis, yAxis, entries, pixi} = this;
            const w = this.$el.offsetWidth;
            const h = this.$el.offsetHeight;
            
            const guideUI = this.guideUI = {};
            guideUI.group = pixi.createContainer(() => {
                guideUI.g = pixi.drawGraphic();
                guideUI.xLabel = pixi.drawLabel(xAxis.label);
                guideUI.yLabel = pixi.drawLabel(yAxis.label);
                guideUI.yLabel.rotation = -90 * deg2rad;
            });
        },

        async drawGuides() {
            const {xAxis, yAxis, entries, pixi} = this;
            const w = this.$el.offsetWidth;
            const h = this.$el.offsetHeight;

            const { guideUI } = this;
            const { g, xLabel, yLabel } = guideUI;
            g.clear();
            pixi.drawLine(g, gap, 0, gap, h-gap, 0x000000);
            pixi.drawLine(g, gap, h-gap, w, h-gap, 0x000000);
            xLabel.x = w/2;
            xLabel.y = h-gap/2;

            yLabel.x = 2;
            yLabel.y = h/2;
        },

        drawEntries() {
            var limit = 100;
            for(var e in this.entries) {
                var entry = this.entries[e];

                if(--limit < 0) break;
                // trace("Entry: ", e, entry);

                const x = 2 + e * 10;
                const y = this.height - parseFloat(entry.Wattage);
                
                // if(this.itemRenderer) {
                //     this.itemRenderer(entry, {x, y});
                // }
            }
        },

        updateChart() {
            trace("Updating the chart!");

            // const entriesPerDate = {};
            // for(var entry of this.entries) {
            //     const date = entry.DateTime;
            //     const dateArr = entriesPerDate[date] || [];
            //     const header = `${entry.Device_ID}:${entry.Serial_Number}`.padEnd(20, ' '); 
            //     dateArr.push(`${header} = ${entry.Wattage}`);

            //     if(!entriesPerDate[date]) entriesPerDate[date] = dateArr;
            // }

            this.redraw();
        }
    },

    beforeDestroy() {
        if(!this.pixi) return;
        this.pixi.destroy();
        this.pixi = null;
    },

    mounted() {
        this.setupPixiCanvas();

        this.updateChart();

        const resizeHandler = () => this.redraw();
        window.addEventListener('resize', resizeHandler);
        this.$once('hook:beforeDestroy', () => {
            window.removeEventListener('resize', resizeHandler);
        });
    },
}
</script>

<style>
.line-chart {
    border: solid 1px pink;
}
</style>