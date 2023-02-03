<template>
    <v-text-field
        v-model="name"
        label="Title"
        counter
        maxlength="140"
        density="compact"
    />
    <optional-stream-info v-model="streamInfo" />
    <automation-input
        v-model="startAutomation"
        label="Segment Start Automation"
    />
</template>

<script setup>
import { useModelValues } from '../../utils/modelValue';
import AutomationInput from '../automations/AutomationInput.vue';
import OptionalStreamInfo from './OptionalStreamInfo.vue';

const props = defineProps({
    modelValue: {}
})

const emit = defineEmits(["update:modelValue"])

const { name, streamInfo, startAutomation } = useModelValues(props, emit, ["name", "streamInfo", "startAutomation"])
</script>