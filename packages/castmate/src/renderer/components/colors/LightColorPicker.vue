<template>
	<v-sheet class="v-color-picker" :style="{ width }">
		<v-tabs v-model="lightType">
			<v-tab value="color"> RGB </v-tab>
			<v-tab value="temperature"> Temperature </v-tab>
		</v-tabs>

		<div
			class="d-flex flex-row justify-center"
			style="position: relative; min-height: 40px"
		>
			<light-color-wheel
				style="width: 200px"
				v-model="modelObj"
				:light-type="lightType"
				class="mt-2"
				v-if="!templateMode && lightType == 'color'"
			/>
			<light-temperature-slider
				style="width: 50px"
				v-model="modelObj"
				:light-type="lightType"
				class="mt-2"
				v-else-if="!templateMode && lightType == 'temperature'"
			/>
			<v-btn
				v-if="props.templatable"
				class="template-btn"
				size="x-small"
				variant="tonal"
				icon="mdi-code-braces"
				:active="templateMode"
				@click="toggleTemplateMode"
			></v-btn>
		</div>
		<div class="v-color-picker__controls" v-if="!templateMode">
			<light-color-preview v-model="modelObj" :light-type="lightType" />
			<div class="v-color-picker-edit" v-if="lightType == 'color'">
				<div class="v-color-picker-edit__input">
					<input
						v-model="hue"
						type="number"
						min="0"
						max="360"
						step="1"
					/>
					<span>Hue</span>
				</div>
				<div class="v-color-picker-edit__input">
					<input
						v-model="sat"
						type="number"
						min="0"
						max="100"
						step="0.01"
					/>
					<span>Saturation</span>
				</div>
				<div class="v-color-picker-edit__input">
					<input
						v-model="bri"
						type="number"
						min="0"
						max="100"
						step="0.01"
					/>
					<span>Brightness</span>
				</div>
			</div>
			<div
				class="v-color-picker-edit"
				v-else-if="lightType == 'temperature'"
			>
				<div class="v-color-picker-edit__input">
					<input
						v-model="kelvin"
						type="number"
						min="2000"
						max="6535"
						step="1"
					/>
					<span>Kelvin</span>
				</div>
				<div class="v-color-picker-edit__input">
					<input
						v-model="bri"
						type="number"
						min="0"
						max="100"
						step="0.01"
					/>
					<span>Brightness</span>
				</div>
			</div>
		</div>
		<div v-if="templateMode && lightType == 'color'" class="px-2">
			<number-input label="Hue" v-model="hue" :schema="templateInputSchema" />
            <number-input label="Saturation" v-model="sat" :schema="templateInputSchema" />
            <number-input label="Brightness" v-model="bri" :schema="templateInputSchema" />
		</div>
        <div v-if="templateMode && lightType == 'temperature'" class="px-2">
            <number-input label="Kelvin" v-model="kelvin" :schema="templateInputSchema" />
            <number-input label="Brightness" v-model="bri" :schema="templateInputSchema" />
		</div>
	</v-sheet>
</template>

<script setup>
import { computed, ref, onMounted } from "vue"
import { useModel } from "../../utils/modelValue"
import NumberInput from "../data/types/NumberInput.vue"
import LightColorPreview from "./LightColorPreview.vue"
import LightColorWheel from "./LightColorWheel.vue"
import LightTemperatureSlider from "./LightTemperatureSlider.vue"

const props = defineProps({
	modelValue: {},
	templatable: { type: Boolean, default: false },
	width: { default: "300px" },
})
const emit = defineEmits(["update:modelValue"])
const modelObj = useModel(props, emit)

const templateMode = ref(false)

function toggleTemplateMode() {
	templateMode.value = !templateMode.value

	if (!templateMode.value) {
		let changed = false
		const result = { ...props.modelValue }
		if (isValueTemplated(props.modelValue.bri)) {
			result.bri = 100
			changed = true
		}
		if (isValueTemplated(props.modelValue.hue)) {
			result.hue = 0
			changed = true
		}
		if (isValueTemplated(props.modelValue.sat)) {
			result.sat = 100
			changed = true
		}
		if (isValueTemplated(props.modelValue.kelvin)) {
			result.kelvin = 4000
			changed = true
		}

		if (changed) {
			modelObj.value = result
		}
	}
}

function isNumberOrNullish(value) {
	if (value == null || value == undefined) return true
	return value instanceof Number || typeof value === "number"
}

function isValueTemplated(value) {
	return !isNumberOrNullish(value)
}

onMounted(() => {
	templateMode.value =
		isValueTemplated(props.modelValue?.hue) ||
		isValueTemplated(props.modelValue?.sat) ||
		isValueTemplated(props.modelValue?.bri) ||
		isValueTemplated(props.modelValue?.kelvin)
})

function stripTemperature(obj) {
	delete obj?.kelvin
	return obj
}

function stripColor(obj) {
	delete obj?.hue
	delete obj?.sat
	return obj
}

const hue = computed({
	get() {
		if (isNumberOrNullish(props.modelValue?.hue)) {
			return Math.round(props.modelValue?.hue ?? 0)
		} else {
			return props.modelValue.hue
		}
	},
	set(newHue) {
		emit(
			"update:modelValue",
			stripTemperature({ ...props.modelValue, hue: newHue })
		)
	},
})

const sat = computed({
	get() {
		if (isNumberOrNullish(props.modelValue?.sat)) {
			return Math.round((props.modelValue?.sat ?? 0) * 100) / 100
		} else {
			return props.modelValue.sat
		}
	},
	set(newSat) {
		emit(
			"update:modelValue",
			stripTemperature({ ...props.modelValue, sat: newSat })
		)
	},
})

const kelvin = computed({
	get() {
		if (isNumberOrNullish(props.modelValue?.kelvin)) {
			return Math.round(props.modelValue?.kelvin ?? 4000)
		} else {
			return props.modelValue.kelvin
		}
	},
	set(newKelvin) {
		emit(
			"update:modelValue",
			stripColor({ ...props.modelValue, kelvin: newKelvin })
		)
	},
})

const bri = computed({
	get() {
		return Math.round((props.modelValue?.bri ?? 0) * 100) / 100
	},
	set(newBri) {
		emit("update:modelValue", { ...props.modelValue, bri: newBri })
	},
})

const lightType = computed({
	get() {
		if (props.modelValue) {
			if ("hue" in props.modelValue && "sat" in props.modelValue) {
				return "color"
			} else if ("kelvin" in props.modelValue) {
				return "temperature"
			}
		}

		return "color"
	},
	set(newLightType) {
		if (newLightType == "temperature") {
			emit(
				"update:modelValue",
				stripColor({ ...props.modelValue, kelvin: 4000 })
			)
		} else if (newLightType == "color") {
			emit(
				"update:modelValue",
				stripTemperature({ ...props.modelValue, hue: 0, sat: 100 })
			)
		}
	},
})


const templateInputSchema = computed(() => ({
	type: "Number",
	template: true,
}))
</script>

<style scoped>
.template-btn {
	position: absolute;
	left: 5px;
	top: 5px;
}
</style>
