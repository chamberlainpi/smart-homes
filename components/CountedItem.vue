<template>
    <span class="font-mono"
        :class="{'font-bold': hasItems}">
        {{label + countStr}}
    </span>
</template>

<script>
export default {
    props: {
        count: Number,
        label: String
    },

    computed: {
        hasItems() {
            return this.count > 0;
        },
        countStr() {
            return this.hasItems ? ` (${this.count})` : '';
        }
    }
}
</script>