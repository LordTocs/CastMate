<template>
	<div
		class="light-temperature-slider"
		:style="{
			backgroundImage: kelvinGradient,
		}"
		ref="slider"
		@mousedown="onMouseDown"
	>
		<div
			class="dot"
			:style="{
				left: `calc(50% - 5px)`,
				top: `calc(${dotPos * 100}% - 5px)`,
			}"
		></div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue"
import { KB } from "castmate-plugin-iot-shared"
import { Color } from "castmate-schema"
import { useEventListener } from "@vueuse/core"
//import { kelvinToCSS } from "../../utils/color"

const props = defineProps<{
	modelValue: KB
}>()

const minTemperature = computed(() => 2000)
const maxTemperature = computed(() => 6535)

const kelvinColors = computed(() => {
	const result: Color[] = []

	const steps = 30
	const tempStep = (maxTemperature.value - minTemperature.value) / steps
	for (let k = minTemperature.value; k < maxTemperature.value; k += tempStep) {
		result.push("#000000") //kelvinToCSS(k, 100))
	}

	return result
})

const kelvinGradient = computed(() => {
	let result = "linear-gradient(180deg, "

	const colors = kelvinColors.value
	for (let i = 0; i < colors.length; ++i) {
		const percent = ((i + 1) / colors.length) * 100
		result += ` ${colors[i]} ${percent}%`

		if (i != colors.length - 1) {
			result += ","
		}
	}

	return result + ")"
})

const kelvin = computed(() => 4000)

const dotPos = computed(() => {
	return (kelvin.value - minTemperature.value) / (maxTemperature.value - minTemperature.value)
})

const slider = ref<HTMLElement>()
const sliderHeight = computed(() => {
	if (!slider.value) return 0
	const rect = slider.value.getBoundingClientRect()
	return rect.bottom - rect.top
})

function posToKelvin(x: number, y: number) {
	const height = sliderHeight.value

	y = Math.max(0, Math.min(height, y))

	const result = minTemperature.value + (y / height) * (maxTemperature.value - minTemperature.value)
	return result
}
const dragging = ref(false)

function onMouseDown(ev: MouseEvent) {
	ev.preventDefault()
	ev.stopPropagation()
	dragging.value = true
}

useEventListener(
	() => (dragging.value ? window : undefined),
	"mousemove",
	(ev: MouseEvent) => {
		if (!slider.value) return
		const rect = slider.value.getBoundingClientRect()

		const localX = ev.clientX - rect.left
		const localY = ev.clientY - rect.top

		const kelvin = posToKelvin(localX, localY)
	}
)

useEventListener(
	() => (dragging.value ? window : undefined),
	"mouseup",
	(ev: MouseEvent) => {
		dragging.value = false
	}
)
</script>

<style scoped>
.light-temperature-slider {
	position: relative;
	aspect-ratio: 0.25;
	border-radius: 20px;
}

.dot {
	position: absolute;
	top: 0;
	left: 0;
	width: 10px;
	height: 10px;
	background: transparent;
	border-radius: 50%;
	box-shadow: 0px 0px 0px 1.5px rgb(255 255 255), inset 0px 0px 1px 1.5px rgb(0 0 0 / 30%);
}
</style>
