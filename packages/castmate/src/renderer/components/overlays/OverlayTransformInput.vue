<template>
    <p class="text-subtitle-2 my-1">Transform</p>
    <div class="d-flex flex-row">
        <number-input label="x" class="mx-2" v-model="x" :density="props.density" />
        <number-input label="y" class="mx-2" v-model="y" :density="props.density"/>
    </div>
    <div class="d-flex flex-row">
        <number-input label="width" class="mx-2" v-model="width" :density="props.density" />
        <number-input label="height" class="mx-2" v-model="height" :density="props.density" />
    </div>
</template>

<script setup>
import { useModelValues } from '../../utils/modelValue';
import NumberInput from '../data/types/NumberInput.vue';

const props = defineProps({
    size: {},
    position: {},
    density: { type: String }
})

const emit = defineEmits(['update:size', 'update:position'])

const {x, y} = useModelValues(props, emit, ['x', 'y'], 'position')
const {width, height} = useModelValues(props, emit, ['width', 'height'], 'size')

</script>