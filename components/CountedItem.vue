<template>
    <span class="monospace"
        :style="{'font-weight': count > 0 ? 'bold' : 'normal'}">
        {{label + (count > 0 ? ` (${count})` : '')}}
    </span>
</template>

<script>
export default {
    props: {
        count: Number,
        label: String
    }
}
</script>