<template>
    <div>
        <span>{{label}}</span>
        <v-select :options="optionsOverZero" v-model="valueLocal">
            <template v-slot:option="entry">
                <CountedItem :count="countItems(countInArray, entry.label, countField)" :label="entry.label" />
            </template>
        </v-select>
    </div>
</template>

<script>

import vSelect from 'vue-select';
import { countItems } from '~/src/utils';
import CountedItem from '~/components/CountedItem.vue';

export default {
    components: {
        CountedItem,
        vSelect,
    },

    props: {
        label: String,
        options: Array,
        countInArray: Array,
        countField: String,
        value: null,
    },

    computed: {
        optionsOverZero() {
            return this.options.filter( rawEntry => countItems(this.countInArray, rawEntry, this.countField) > 0 );
        },

        valueLocal: {
            get() {
                return this.value;
            },
            set(v) {
                this.$emit('input', v);
            }
        }
    },

    methods: {
        countItems,
    }
}
</script>

<style>

</style>