<template>
	<div
		class="light-temperature-slider"
		:style="{
            backgroundImage: kelvinGradient
        }"
		ref="slider"
		@mousedown="onMouseDown"
		@touchstart="onMouseDown"
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

<script setup>
import { ref, computed, onBeforeUnmount } from "vue"
import { kelvinToCSS } from "../../utils/color"

const props = defineProps({
	modelValue: {},
	lightType: { type: String },
})
const emit = defineEmits(["update:modelValue"])

const minTemperature = computed(() => 2000)
const maxTemperature = computed(() => 6535)

const kelvinColors = computed(() => {
	const result = []

	const steps = 30
	const tempStep = (maxTemperature.value - minTemperature.value) / steps
	for (
		let k = minTemperature.value;
		k < maxTemperature.value;
		k += tempStep
	) {
		result.push(kelvinToCSS(k, 100))
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

const kelvin = computed({
	get() {
		return props.modelValue?.kelvin ?? 4000
	}
})

function stripColor(obj) {
	delete obj?.hue
	delete obj?.sat
	return obj
}
const dotPos = computed(() => {
	return (
		(kelvin.value - minTemperature.value) /
		(maxTemperature.value - minTemperature.value)
	)
})

const slider = ref(null)
const sliderHeight = computed(() => {
	if (!slider.value) return 0
	const rect = slider.value.getBoundingClientRect()
	return rect.bottom - rect.top
})

function posToKelvin(x, y) {
	const height = sliderHeight.value

	y = Math.max(0, Math.min(height, y))

    const result = (
		minTemperature.value +
		(y / height) * (maxTemperature.value - minTemperature.value)
	)
	return result
}
const dragging = ref(false)

function getEventCoordinates(e) {
	if ("touches" in e) {
		return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
	}

	return { clientX: e.clientX, clientY: e.clientY }
}

function onMouseDown(e) {
	e.preventDefault()

	dragging.value = true
	window.addEventListener("mousemove", onMouseMove)
	window.addEventListener("mouseup", onMouseUp)
	window.addEventListener("touchmove", onMouseMove)
	window.addEventListener("touchend", onMouseUp)
}

function onMouseMove(e) {
	const coords = getEventCoordinates(e)
	const rect = slider.value.getBoundingClientRect()

	const localX = coords.clientX - rect.left
	const localY = coords.clientY - rect.top

	const kelvin = posToKelvin(localX, localY)

	const newValue = { ...props.modelValue, kelvin }
	if (newValue.bri == null) {
		//If we're selecting with the temp slider and there's no bri, we should set it to 100
		newValue.bri = 100
	}

	emit("update:modelValue", stripColor(newValue))
}

function onMouseUp(e) {
	dragging.value = false
	window.removeEventListener("mousemove", onMouseMove)
	window.removeEventListener("mouseup", onMouseUp)
	window.removeEventListener("touchmove", onMouseMove)
	window.removeEventListener("touchend", onMouseUp)
}

onBeforeUnmount(() => {
	window.removeEventListener("mousemove", onMouseMove)
	window.removeEventListener("mouseup", onMouseUp)
	window.removeEventListener("touchmove", onMouseMove)
	window.removeEventListener("touchend", onMouseUp)
})
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
	box-shadow: 0px 0px 0px 1.5px rgb(255 255 255),
		inset 0px 0px 1px 1.5px rgb(0 0 0 / 30%);
}
</style>
