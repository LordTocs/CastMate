<template>
	<p v-if="label" class="text-subtitle-2 my-1 text-medium-emphasis">
		{{ label }}
	</p>
	<div class="d-flex flex-row" v-bind="$attrs">
		<number-input
			label="left"
			class="mr-2"
			v-model="left"
			:unit="{ name: 'px' }"
			:density="props.density"
		/>
		<number-input
			label="right"
			class="ml-2"
			v-model="right"
			:unit="{ name: 'px' }"
			:density="props.density"
		/>
	</div>
	<div class="d-flex flex-row">
		<number-input
			label="top"
			class="mr-2"
			v-model="top"
			:unit="{ name: 'px' }"
			:density="props.density"
		/>
		<number-input
			label="bottom"
			class="ml-2"
			v-model="bottom"
			:unit="{ name: 'px' }"
			:density="props.density"
		/>
	</div>
</template>

<script setup>
import { useModelValues } from "../../../utils/modelValue"
import NumberInput from "./NumberInput.vue"

const props = defineProps({
	label: { type: String },
	modelValue: {},
	density: { type: String },
})

const emit = defineEmits(["update:modelValue"])

const { top, bottom, left, right } = useModelValues(props, emit, [
	"top",
	"bottom",
	"left",
	"right",
])
</script>
