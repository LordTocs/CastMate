<template>
	<div class="color-picker flex flex-row gap-1">
		<div class="wheel">
			<p class="text-xs m-0">&nbsp;</p>
			<color-wheel-picker v-model="model" />
		</div>
		<div class="sliders gap-1">
			<p class="text-xs m-0">RGB</p>
			<linear-gradient-picker label="R" :gradient="redGradient" v-model="red" :min="0" :max="255" />
			<linear-gradient-picker label="G" :gradient="greenGradient" v-model="green" :min="0" :max="255" />
			<linear-gradient-picker label="B" :gradient="blueGradient" v-model="blue" :min="0" :max="255" />
			<p class="text-xs m-0">HSV</p>
			<linear-gradient-picker label="H" :gradient="hueGradient" v-model="hue" :min="0" :max="360" />
			<linear-gradient-picker label="S" :gradient="satGradient" v-model="sat" :min="0" :max="100" />
			<linear-gradient-picker label="V" :gradient="valueGradient" v-model="val" :min="0" :max="100" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { Color } from "castmate-schema"
import { useDataBinding } from "../../../main"

import LinearGradientPicker from "./color/LinearGradientPicker.vue"
import ColorWheelPicker from "./color/ColorWheelPicker.vue"
import { computed } from "vue"
import { useColorProperties } from "./color/color-utils"

import * as chromatism from "chromatism2"

const props = defineProps<{
	localPath?: string
}>()

const model = defineModel<Color>()

const { red, green, blue, hue, sat, val } = useColorProperties(model)

const redGradient = computed(
	() => `linear-gradient(to right, rgb(0, ${green.value}, ${blue.value}), rgb(255, ${green.value}, ${blue.value}))`
)
const greenGradient = computed(
	() => `linear-gradient(to right, rgb(${red.value}, 0, ${blue.value}), rgb(${red.value}, 255, ${blue.value}))`
)
const blueGradient = computed(
	() => `linear-gradient(to right, rgb(${red.value}, ${green.value}, 0), rgb(${red.value}, ${green.value}, 255))`
)

const hueGradient = `linear-gradient(to right in hsl longer hue, hsl(0, 100%, 50%), hsl(359, 100%, 50%))`

const satGradient = computed(() => {
	const minColor = chromatism.convert({ h: hue.value, s: 0, v: val.value }).csshsl
	const maxColor = chromatism.convert({ h: hue.value, s: 100, v: val.value }).csshsl

	return `linear-gradient(to right, ${minColor}, ${maxColor})`
})

const valueGradient = computed(() => {
	const minColor = chromatism.convert({ h: hue.value, s: sat.value, v: 0 }).csshsl
	const maxColor = chromatism.convert({ h: hue.value, s: sat.value, v: 100 }).csshsl

	return `linear-gradient(to right, ${minColor}, ${maxColor})`
})

useDataBinding(() => props.localPath)
</script>

<style scoped>
.color-picker {
}
.wheel {
	width: 12rem;
}

.sliders {
	width: 12rem;
	display: flex;
	flex-direction: column;
}
</style>
