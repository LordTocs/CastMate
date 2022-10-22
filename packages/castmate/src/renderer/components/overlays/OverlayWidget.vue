<template>
    <resizable v-model:transform="modelValue" v-model:selected="selected">
        <!--Put a div over top to block any interaction with the underlying widget.
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0"></div> -->
        <widget-loader :widgetConfig="props.modelValue" />
    </resizable>
</template>


<script setup>
import Resizable from '../dragging/Resizable.vue'
import WidgetLoader from './WidgetLoader.vue'
import _cloneDeep from 'lodash/cloneDeep'
import { ref, computed } from 'vue';

const props = defineProps({
    modelValue: {},
    selected: { type: Boolean}
})
const emit = defineEmits(['update:modelValue', 'update:selected']);


const modelValue = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

const selected = computed({
    get() {
        return props.selected;
    },
    set(value) {
        emit('update:selected', value)
    }
});


</script>


<style scoped>

</style>