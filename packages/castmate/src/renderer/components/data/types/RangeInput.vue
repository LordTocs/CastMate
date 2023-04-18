<template>
	<div>
		<div class="text-caption" v-if="props.label">
			{{ props.label }}
		</div>
		<div class="d-flex flex-row align-center">
			<number-input
				class="my-0 py-0"
				v-model="minValue"
				:density="density"
				:schema="{
					type: 'Number',
					template: canTemplate,
					placeholder: '−∞',
				}"
			/>
			<span class="mx-3">⟶</span>
			<number-input
				class="my-0 py-0"
				v-model="maxValue"
				:density="density"
				:schema="{
					type: 'Number',
					template: canTemplate,
					placeholder: '∞',
				}"
			/>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue"
import { useModelValues } from "../../../utils/modelValue"
import NumberInput from "./NumberInput.vue"

const props = defineProps({
	modelValue: {},
	schema: {},
	label: { type: String, default: "" },
	density: {},
	context: {},
	secret: { type: Boolean },
	colorRefs: {},
})
const emit = defineEmits(["update:modelValue"])
const canTemplate = computed(() => !!props.schema?.template)

const minValue = computed({
	get() {
		return props.modelValue?.min
	},
	set(newMin) {
		let newValue = { ...props.modelValue }

		if (newMin == null) {
			delete newValue.min

			if (newValue.max == null) {
				newValue = undefined
			}
		} else {
			newValue.min = newMin
		}

		emit("update:modelValue", newValue)
	},
})

const maxValue = computed({
	get() {
		return props.modelValue?.max
	},
	set(newMax) {
		let newValue = { ...props.modelValue }

		console.log(newMax)
		if (newMax == null) {
			delete newValue.max

			if (newValue.min == null) {
				newValue = undefined
			}
		} else {
			newValue.max = newMax
		}

		emit("update:modelValue", newValue)
	},
})

/*
const { min: minValue, max: maxValue } = useModelValues(props, emit, [
	"min",
	"max",
])*/
</script>

<style scoped>
.label-span {
	display: inline-block;
	position: relative;
	line-height: 15px;
	font-size: 12px;
	min-height: 6px;
	bottom: -6px;
}
</style>
