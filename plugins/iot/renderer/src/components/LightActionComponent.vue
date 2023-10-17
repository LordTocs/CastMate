<template>
	<div
		v-if="modelValue.on !== false"
		:style="{ backgroundColor: LightColor.toColor(props.modelValue.lightColor) }"
	></div>
	<div v-else></div>
</template>

<script setup lang="ts">
import { LightColor } from "castmate-plugin-iot-shared"
import { Toggle } from "castmate-schema"

const props = defineProps<{
	modelValue: { lightColor: LightColor; on: Toggle }
}>()
</script>

<style scoped></style>
