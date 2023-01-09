<template>
    <p v-if="label" class="text-subtitle-2 my-1 text-medium-emphasis">{{ label }}</p>
    <div class="d-flex flex-row" v-bind="$attrs">
        <div class="mr-2" style="flex: 1">
            <number-input v-model="duration" label="Transition Duration" :unit="{ name: 's', short: 's'}" :density="props.density"></number-input>
        </div>
        <div class="ml-2" style="flex: 1">
            <v-select :items="animationItems" v-model="animation" label="Animation" :density="props.density"></v-select>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useModelValues } from '../../../utils/modelValue';
import NumberInput from './NumberInput.vue';

const props = defineProps({
    label: { type: String },
    modelValue: { },
    density: { type: String },
})

const emit = defineEmits(['update:modelValue']);

const animationItems = ref([
    'None',
    'Fade',
    'Grow',
    'Slide Right',
])


const {duration, animation} = useModelValues(props, emit, ['duration', 'animation']);
</script>