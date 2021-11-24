<template>
    <div>
        <svg :class="svgClassName" :width="width" :height="height"></svg>
    </div>
</template>

<script>
import { _ } from '@/src/utils';

const d3 = require('d3');

let INSTANCE_ID = 1;

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
        instanceID: INSTANCE_ID++,
        svg: null
    }),

    watch: {
        entries() {
            this.updateChart();
        }
    },

    computed: {
        svgClassName() {
            return `svg-linechart-${this.instanceID}`;
        }
    },

    methods: {
        addLine(x1, y1, x2, y2, color) {
            this.svg.append('line')
              .attr('x1', x1)
              .attr('y1', y1)
              .attr('x2', x2)
              .attr('y2', y2)
              .attr('stroke', color);
        },

        clearSVG() {
            if(!this.svg) return;
            this.svg.selectAll('*').remove();
            this.svg = null;
        },

        redraw() {
            this.clearSVG();
            this.svg = d3.select( '.' + this.svgClassName );
            
            this.drawGuides();
            this.drawEntries();
        },

        drawGuides() {
            const {xAxis, yAxis, entries, svg} = this;
            const w = this.$el.offsetWidth;
            const h = this.$el.offsetHeight;
            const gap = 20;

            const getMinMax = axis => ({
                min: d3.min(entries, axis.compareFunc),
                max: d3.min(entries, axis.compareFunc),
            });

            const xLimits = getMinMax(xAxis);
            const yLimits = getMinMax(yAxis);

            const y = d3.scaleLinear()
                        .domain([0, yLimits.max])
                        .range([h-gap, gap]);

            const x = d3.scaleTime()
                        .domain([xLimits.min, xLimits.max])
                        .range([gap, w-gap]);

            const xGuide = d3.axisBottom(x);
            const yGuide = d3.axisLeft(y);

            const chartGroup = svg.append('g')
                                .attr('transform', 'translate(50, 0)');

            const line = d3.line()
                            .x( d => x( xAxis.compareFunc(d) ) )
                            .y( d => y( yAxis.compareFunc(d) ) );

            chartGroup.append('path').attr('class', 'line-chart').attr('d', line(entries));
            chartGroup.append('g').attr('class', 'x-axis').call(xGuide);
            chartGroup.append('g').attr('class', 'y-axis').call(yGuide);

            trace("Entries: ", entries.length);
            // const gap = 20; //Label gap
            // const hgap = h - gap;

            // //xAxis:
            // this.addLine(0, hgap, w, hgap, '#000');

            // //yAxis:
            // this.addLine(0, h, 0, 0, '#000');
        },

        drawEntries() {
            return;
            for(var e in this.entries) {
                var entry = this.entries[e];

                const x = 2 + e * 10;
                const y = this.height - parseFloat(entry.Wattage);
                
                this.addLine(x, this.height, x, y, 'red');

                // if(this.itemRenderer) {
                //     this.itemRenderer(entry, {x, y});
                // }
            }
        },

        updateChart() {
            const entriesPerDate = {};
            for(var entry of this.entries) {
                const date = entry.DateTime;
                const dateArr = entriesPerDate[date] || [];
                const header = `${entry.Device_ID}:${entry.Serial_Number}`.padEnd(20, ' '); 
                dateArr.push(`${header} = ${entry.Wattage}`);

                if(!entriesPerDate[date]) entriesPerDate[date] = dateArr;
            }

            trace(JSON.stringify(entriesPerDate, null, '  '));

            this.redraw();
        }
    },

    beforeDestroy() {
        this.clearSVG();
    },

    mounted() {
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
    stroke: blue;
    stroke-width: 2px;
    fill: none;
}
</style>