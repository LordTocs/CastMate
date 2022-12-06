<template>
    <p class="text-subtitle-2 my-1">Transform</p>
    <div class="d-flex flex-row">
        <number-input label="x" class="mx-2" v-model="x" />
        <number-input label="y" class="mx-2" v-model="y" />
    </div>
    <div class="d-flex flex-row">
        <number-input label="width" class="mx-2" v-model="width" />
        <number-input label="height" class="mx-2" v-model="height" />
    </div>
</template>

<script setup>
import { useModelValues } from '../../utils/modelValue';
import NumberInput from '../data/types/NumberInput.vue';

const props = defineProps({
    size: {},
    position: {}
})

const emit = defineEmits(['update:size', 'update:position'])

const {x, y} = useModelValues(props, emit, ['x', 'y'], 'position')
const {width, height} = useModelValues(props, emit, ['width', 'height'], 'size')

</script>