<template>
<revealer :transition="props.transition" :animation="props.animation" v-show="visible">
    <slot></slot>   
</revealer>
</template>

<script setup>
import { computed, ref } from 'vue';
import Revealer from './Revealer.vue';
import { isNumber } from './typeHelpers.js';

const props = defineProps({
    transition: { },
    animation: {},
    appearDelay: { type: Number, default: 0 },
    dissappearAhead: { type: Number, default: 0 },
})

const transitionTime = computed(() => {
    if (!props.transition)
        return 0;
    if (isNumber(props.transition))
        return props.transition
    return props.transition.duration
})

const visible = ref(false);

defineExpose({
    appear(duration) {
        setTimeout(() => {
            visible.value = true;
        }, props.appearDelay * 1000);

        const beginDissappearing = Math.max(0, duration - (props.dissappearAhead + transitionTime.value))

        setTimeout(() => {
            visible.value = false;
        }, beginDissappearing * 1000);
    }
})
</script>