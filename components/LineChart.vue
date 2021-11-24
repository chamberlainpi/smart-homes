<template>
    <div>
        <svg :class="svgClassName" :width="width" :height="height"></svg>
    </div>
</template>

<script>

const d3 = require('d3');

let INSTANCE_ID = 1;

export default {
    props: {
        width: Number,
        height: Number,
        entries: Array,
        itemRenderer: Function
    },

    data: () => ({
        instanceID: INSTANCE_ID++,
        svg: null
    }),

    watch: {
        entries() {
            this.redraw();
        }
    },

    computed: {
        svgClassName() {
            return `svg-linechart-${this.instanceID}`;
        }
    },

    methods: {
        addLine(from, to, color) {
            const { svg } = this;
            const [x1, y1] = from;
            const [x2, y2] = to;

            const line = svg.append('line')
              .attr('x1', x1)
              .attr('y1', y1)
              .attr('x2', x2)
              .attr('y2', y2)
              .attr('stroke', color);
        },

        redraw() {
            this.clearSVG();
            this.svg = d3.select( '.' + this.svgClassName );
            
            for(var e in this.entries) {
                var entry = this.entries[e];

                const x = 2 + e * 10;
                const y = this.height - parseFloat(entry.Wattage);
                
                this.addLine([x, this.height], [x, y], 'red');

                if(this.itemRenderer) {
                    this.itemRenderer(entry, {x, y});
                }
            }
        },

        clearSVG() {
            if(!this.svg) return;
            this.svg.selectAll('*').remove();
            this.svg = null;
        }
    },

    beforeDestroy() {
        this.clearSVG();
    },

    mounted() {
        this.redraw();
    },
}
</script>

