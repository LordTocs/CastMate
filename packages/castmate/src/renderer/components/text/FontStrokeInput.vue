<template>
    <v-card variant="outlined" class="px-4">
        <v-card-subtitle class="d-flex flex-row py-2 align-center">
            <div class="flex-grow-1 "> Stroke </div> <v-btn icon="mdi-close" @click="emit('update:modelValue', null)" />
        </v-card-subtitle>
        <number-input v-model="width" label="Width" />
        <color-input v-model="color" :color-refs="props.colorRefs" label="Color" />
    </v-card>
</template>

<script setup>
import { useModelValues } from '../../utils/modelValue';
import ColorInput from '../data/types/ColorInput.vue';
import NumberInput from '../data/types/NumberInput.vue';

const props = defineProps({
    modelValue: {},
    colorRefs: {}
})
const emit = defineEmits(["update:modelValue"])

const { width, color } = useModelValues(props, emit, ['width', 'color']);
</script>

<style scoped>
</style>