<template>
    <div class="line-chart" :style="{width, height}">
        <canvas ref="canvas"></canvas>
    </div>
</template>

<script>
import { _, defer } from '@/src/utils';
import { createPixiApp } from '@/src/utils.pixi';

const gap = {x: 50, y: 80};
const deg2rad = Math.PI / 180;

export default {
    props: {
        width: String,
        height: String,
        entries: Array,
        itemRenderer: Function,
        xAxis: Object,
        yAxis: Object,
        xBounds: Array,
        yBounds: Array,
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
            this.adjustGuides();
            this.adjustEntries();
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

        initEntries() {
            /**
             * Reason that we "init" the entries and not simply "draw" them right away
             * is to prepare each one belonging to a given timestamp to render on a PIXI.Container.
             * Then, when scaling the graph horizontally, it's just a matter of adjusting those
             * containers' X positions.
             */
            const {xAxis, yAxis, entries, pixi, guideUI} = this;

            if(this.xTickContainer) {
                this.xTickContainer.destroy({children: true});
            }

            const xTickContainer = this.xTickContainer = pixi.createContainer();
            const xTicks = xTickContainer._ticks = {};
            const xTickRender = xAxis.tick || (v => v);

            for(var entry of entries) {
                const xData = xAxis.compareFunc(entry);
                
                if(xTicks[xData]) continue;

                const tick = xTicks[xData] = pixi.createContainer(tick => {
                    tick._label = pixi.drawLabel(xTickRender(xData), 0, 10, {fontSize: xAxis.size || 20});
                    tick._label.pivot.x = (tick._label.width * .5) | 0;
                    tick._line = pixi.drawGraphic(g => pixi.drawLine(g, 0, 0, 0, 10));
                    tick._entries = pixi.drawGraphic();
                });

                tick.name = xData;

                xTickContainer.addChild(tick);
            }
            
        },

        async adjustGuides() {
            const {xAxis, yAxis, entries, pixi} = this;
            const w = this.$el.offsetWidth;
            const h = this.$el.offsetHeight;

            const { guideUI } = this;
            const { g, xLabel, yLabel } = guideUI;
            g.clear();
            pixi.drawLine(g, gap.x, 0, gap.x, h-gap.y, 0x000000);
            pixi.drawLine(g, gap.x, h-gap.y, w, h-gap.y, 0x000000);
            xLabel.x = w/2;
            xLabel.y = h-gap.y/2;

            yLabel.x = 2;
            yLabel.y = h/2;

            xAxis.boundsPixels = [gap.x, w];
            yAxis.boundsPixels = [h-gap.y, 0];

            const solveAxisBounds = (axis, bounds) => {
                const evaluate = axis.evaluate || (a => a);
                const [min, max] = bounds.map(evaluate);
                const [minPX, maxPX] = axis.boundsPixels;
                const diff = max - min;
                const diffPixels = maxPX - minPX;
                
                axis.plot = v => {
                    const value = evaluate(v);
                    const ratio = (value - min) / diff;
                    return minPX + ratio * diffPixels;
                }
            }

            solveAxisBounds(xAxis, this.xBounds);
            solveAxisBounds(yAxis, this.yBounds);

            const xTicks = this.xTickContainer._ticks;
            for(var xData in xTicks) {
                const xTick = xTicks[xData];
                const x = xAxis.plot(xData);
                const y = yAxis.plot(0);
                xTick.x = x;
                xTick.y = 0;

                xTick._entries.clear();
                xTick._entries.beginFill(0xff0000);
            }

            for(var e in this.entries) {
                var entry = this.entries[e];

                // trace("Entry: ", e, entry);
                const xData = xAxis.compareFunc(entry);
                const yData = yAxis.compareFunc(entry);
                const xTick = xTicks[xData];

                xTick._entries.drawCircle(0, yAxis.plot(yData), 2);
                
                // if(this.itemRenderer) {
                //     this.itemRenderer(entry, {x, y});
                // }
            }
        },

        adjustEntries() {
            const {xAxis, yAxis, entries, pixi} = this;
            
            const xTicks = this.xTickContainer._ticks;
            for(var xData in xTicks) {
                const xTick = xTicks[xData];
                const x = xAxis.plot(xData);
                const y = yAxis.plot(0);
                xTick.x = x;
                xTick.y = y;

                xTick._entries.clear();
                xTick._entries.beginFill(0xff0000);
            }


            for(var e in this.entries) {
                var entry = this.entries[e];

                // trace("Entry: ", e, entry);
                const xData = xAxis.compareFunc(entry);
                const yData = yAxis.compareFunc(entry);
                const xTick = xTicks[xData];

                xTick._entries.drawCircle(0, yAxis.plot(yData), 2);
                
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
            
            this.initEntries();

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