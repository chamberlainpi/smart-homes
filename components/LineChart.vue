<template>
    <div class="line-chart" :style="{width, height}">
        <canvas ref="canvas"></canvas>
    </div>
</template>

<script>
import { _, defer, clamp } from '@/src/utils';
import { createPixiApp } from '@/src/utils.pixi';

const gap = {x: 50, y: 80};
const deg2rad = Math.PI / 180;

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
                resizeTo: $el,
                onMouseMove: mouseXY => this.onMouseMove(mouseXY)
            });

            this.initGuides();
        },

        clearCanvas() {
            if(!this.pixi) return;
            this.pixi.clear();
        },

        async updateChart(skipInit=false) {
            !skipInit && this.initEntries();

            await this.adjustGuides();
            await this.adjustEntries();
            this.onMouseMove(null);
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
                    tick._label = pixi.drawLabel(xTickRender(xData), 0, 0, {fontSize: xAxis.size || 12});
                    tick._label.pivot.y = -10;
                    tick._label.pivot.x = (tick._label.width * .5) | 0;
                    tick._line = pixi.drawGraphic(g => pixi.drawLine(g, 0, 0, 0, 10, 0x0, 1));
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
            this.drawMainGuides();

            xAxis.boundsPixels = [gap.x, w];
            yAxis.boundsPixels = [h-gap.y, 0];

            const solveAxisBounds = (axis, bounds) => {
                const evaluate = axis.evaluate || (a => a);
                const [min, max] = bounds.map(evaluate);
                const [minPX, maxPX] = axis.boundsPixels;
                const diff = max - min;
                const diffPixels = maxPX - minPX;
                
                return v => {
                    const value = evaluate(v);
                    const ratio = (value - min) / diff;
                    return minPX + ratio * diffPixels;
                }
            }

            xAxis.plot = solveAxisBounds(xAxis, this.xBounds);
            yAxis.plot = solveAxisBounds(yAxis, this.yBounds);

            const xTicks = this.xTickContainer._ticks;
            for(var xData in xTicks) {
                const tick = xTicks[xData];
                tick.x = xAxis.plot(xData);
                tick.y = 0;
                tick._label.y = 0; yAxis.plot(0);

                tick._entries.clear();
                tick._entries.beginFill(0xff0000);
            }

            for(var e in this.entries) {
                var entry = this.entries[e];

                const xData = xAxis.compareFunc(entry);
                const yData = yAxis.compareFunc(entry);
                const xTick = xTicks[xData];

                xTick._entries.drawCircle(0, yAxis.plot(yData), 2);
            }
        },

        async adjustEntries() {
            const {xAxis, yAxis, entries, pixi} = this;
            
            const xTicks = this.xTickContainer._ticks;
            for(var xData in xTicks) {
                const tick = xTicks[xData];
                const x = xAxis.plot(xData);
                const y = yAxis.plot(0);
                tick.x = x | 0;
                tick.y = 0;
                tick._label.y = y;
                tick._line.y = y;

                tick._entries.clear();
                tick._entries.beginFill(0xff0000);
            }


            for(var e in this.entries) {
                var entry = this.entries[e];
                const xData = xAxis.compareFunc(entry);
                const yData = yAxis.compareFunc(entry);
                const xTick = xTicks[xData];

                xTick._entries.drawCircle(0, yAxis.plot(yData), 2);
            }
        },

        drawMainGuides() {
            const { pixi, guideUI } = this;
            const { g, xLabel, yLabel } = guideUI;
            const w = this.$el.offsetWidth;
            const h = this.$el.offsetHeight;

            g.clear();
            pixi.drawLine(g, gap.x, 0, gap.x, h-gap.y, 0x000000);
            pixi.drawLine(g, gap.x, h-gap.y, w, h-gap.y, 0x000000);
            xLabel.x = w/2;
            xLabel.y = h-gap.y/2;

            yLabel.x = 2;
            yLabel.y = h/2;
        },

        onMouseMove(mouseXY) {
            const {yAxis} = this;
            const xTicks = this.xTickContainer._ticks;
            const yZero = yAxis.plot(0);
            const entryAlpha = 0.3;
            const entryAlphaInv = 1 - entryAlpha;
            const proximity = 20;
            const distance = 5;

            if(!mouseXY) {
                for(var xData in xTicks) {
                    const tick = xTicks[xData];

                    tick._label.alpha = 0;
                    tick._line.alpha = 0;
                    tick._entries.alpha = 0.5;
                }
            } else {
                const {x, y} = mouseXY;
                
                for(var xData in xTicks) {
                    const tick = xTicks[xData];

                    const a = clamp( 1 - Math.abs(x - tick.x)/proximity, 0, 1);

                    tick._label.alpha = a > 0.9 ? 1 : 0;
                    tick._line.alpha = a;
                    tick._entries.alpha = entryAlpha + a * entryAlphaInv;

                    const aExpo = (a * 2)**2;
                    tick._label.y = yZero + aExpo * distance;
                    tick._line.scale.y = 1 + a;
                }
            }
            
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

        const resizeHandler = () => this.updateChart(true);

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