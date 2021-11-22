<template>
    <div>
        <h1>Testing</h1>
        <svg></svg>
    </div>
</template>

<script lang="ts">
import { setupSVG } from '~/src/svg.helper.js';

export default {
    mounted() {
        setupSVG('svg', {
            width: 300,
            height: 200,
            class: 'svg-container'
        });
    }
}
</script>

