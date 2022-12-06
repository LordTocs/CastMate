<template>
    <v-card variant="outlined" class="px-4">
        <v-card-subtitle class="d-flex flex-row py-2 align-center">
            <div class="flex-grow-1 "> Shadow </div> <v-btn icon="mdi-close" @click="emit('update:modelValue', null)" />
        </v-card-subtitle>
        <div class="d-flex flex-row">
            <number-input v-model="offsetX" label="Offset X" class="mr-2" />
            <number-input v-model="offsetY" label="Offset Y" />    
        </div>
        <number-input v-model="blur" label="Blur" />
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

const { offsetX, offsetY, blur, color } = useModelValues(props, emit, ['offsetX', 'offsetY', 'blur', 'color']);
</script>

<style scoped>
</style>