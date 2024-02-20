<template>
	<p-input-text v-model="bufferedNumModel" @blur="onBlur" :placeholder="placeholder" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"

import PInputText from "primevue/inputtext"

const props = defineProps<{
	modelValue: number | undefined
	min?: number
	max?: number
	step?: number
	placeholder?: string
}>()

const emit = defineEmits(["update:modelValue"])

const numEditModel = ref("")

onMounted(() => {
	watch(
		() => props.modelValue,
		() => {
			if (props.modelValue != null) {
				numEditModel.value = String(props.modelValue)
			} else {
				numEditModel.value = ""
			}
		},
		{ immediate: true }
	)
})

const bufferedNumModel = computed<string | undefined>({
	get() {
		return numEditModel.value
	},
	set(v) {
		if (v != null) {
			numEditModel.value = v
			if (v == "") {
				return emit("update:modelValue", undefined)
			}
			const num = Number(v)
			if (!isNaN(num)) {
				emit("update:modelValue", num)
			}
		} else {
			emit("update:modelValue", undefined)
		}
	},
})

function roundToStep(value: number, step: number) {
	return Math.round(value / step) * step
}

function onBlur() {
	if (numEditModel.value == "") {
		return emit("update:modelValue", undefined)
	}

	const num = Number(numEditModel.value)
	if (isNaN(num)) {
		numEditModel.value = props.modelValue != null ? String(props.modelValue) : ""
	} else {
		let finalNum = num
		if (props.step != null) {
			finalNum = roundToStep(finalNum, props.step)
		}

		if (props.max != null) {
			finalNum = Math.min(finalNum, props.max)
		}

		if (props.min != null) {
			finalNum = Math.max(finalNum, props.min)
		}

		if (finalNum != props.modelValue) {
			emit("update:modelValue", finalNum)
		}
	}
}
</script>

<style scoped></style>
