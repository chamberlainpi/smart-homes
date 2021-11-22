<template>
    <div>
        <h1>Testing {{instanceID}}</h1>
        <svg :class="svgClassName" :width="width" :height="height"></svg>
    </div>
</template>

<script>
import { setupSVG } from '~/src/svg.helper.js';

const d3 = require('d3');

let INSTANCE_ID = 1;

export default {
    props: {
        width: Number,
        height: Number
    },

    data: () => ({
        instanceID: INSTANCE_ID++,
        svg: null
    }),

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
        }
    },

    beforeDestroy() {
        if(this.svg) {
            this.svg.remove();
            this.svg = null;
        }
    },

    mounted() {
        this.svg = d3.select( '.' + this.svgClassName );
        this.addLine([10, 20], [100, 150], 'red');
    },
}
</script>

