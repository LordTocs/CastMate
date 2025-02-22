<template>
	<number-field
		v-model="model"
		:min="min"
		:max="max"
		:placeholder="placeholder"
		:suffix="suffix"
		style="width: 100%"
	/>
</template>

<script setup lang="ts">
import { useDataBinding } from "../../../main"
import NumberField from "./NumberField.vue"

const model = defineModel<number>()

const props = defineProps<{
	min?: number
	max?: number
	step?: number
	placeholder?: string
	localPath?: string
	suffix?: string
}>()

useDataBinding(() => props.localPath)
</script>

<style scoped></style>
