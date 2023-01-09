<template>
    <p v-if="label" class="text-subtitle-2 my-1 text-medium-emphasis">{{ label }}</p>
    <div class="d-flex flex-row" v-bind="$attrs">
        <number-input v-model="appearDelay" :unit="{ name: 's', short: 's'}" label="Appear Delay" class="mr-2" :density="props.density"></number-input>
        <number-input v-model="vanishAdvance" :unit="{ name: 's', short: 's'}" label="Vanish Advance" class="ml-2" :density="props.density"></number-input>
    </div>
</template>


<script setup>
import { useModelValues } from '../../../utils/modelValue';
import NumberInput from './NumberInput.vue';

const props = defineProps({
    label: { type: String },
    modelValue: { },
    density: { type: String }
})

const emit = defineEmits(['update:modelValue']);

const  { appearDelay, vanishAdvance } = useModelValues(props, emit, ['appearDelay', 'vanishAdvance'])
</script>