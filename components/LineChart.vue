<template>
    <div class="line-chart" :style="{width, height}">
        <canvas ref="canvas" width="100%" height="100%"></canvas>
    </div>
</template>

<script>
import { _, defer } from '@/src/utils';
import { createPixiApp } from '@/src/utils.pixi';

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

            // this.pixi.test();
        },

        clearCanvas() {
            if(!this.pixi) return;
            this.pixi.clear();
        },

        redraw() {
            this.clearCanvas();
            
            this.drawGuides();
            this.drawEntries();
        },

        async drawGuides() {
            const {xAxis, yAxis, entries} = this;
            const w = this.$el.offsetWidth;
            const h = this.$el.offsetHeight;
            const gap = 20;

            
        },

        drawEntries() {
            var limit = 100;
            for(var e in this.entries) {
                var entry = this.entries[e];

                if(--limit < 0) break;
                trace("Entry: ", e, entry);

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