<template>
	<div
		class="light-color-picker-wheel"
		ref="wheel"
		@mousedown="onMouseDown"
		@touchstart="onMouseDown"
	>
		<div class="hue-wheel"></div>
		<div class="saturation-wheel"></div>
		<div
			class="dot"
			:style="{
				top: `${dotPosition.y - 5}px`,
				left: `${dotPosition.x - 5}px`,
			}"
		></div>
	</div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from "vue"
const props = defineProps({
	modelValue: {},
	lightType: { type: String },
})
const emit = defineEmits(["update:modelValue"])

const wheel = ref(null)
const wheelDiameter = computed(() => {
	if (!wheel.value) return 0
	const rect = wheel.value.getBoundingClientRect()
	return rect.bottom - rect.top
})

function stripTemperature(obj) {
	delete obj?.kelvin
	return obj
}

const hue = computed({
	get() {
		if (props.lightType != "color") {
			return 0
		}

		return props.modelValue?.hue ?? 0
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
		if (props.lightType != "color") {
			return 0
		}

		return props.modelValue?.sat ?? 0
	},
	set(newSat) {
		emit(
			"update:modelValue",
			stripTemperature({ ...props.modelValue, sat: newSat })
		)
	},
})

const dotPosition = computed(() => {
	const hueAngleRad = ((hue.value - 90) * Math.PI) / 180
	const radius = wheelDiameter.value / 2
	const satRadius = (sat.value * radius) / 100
	const result = {
		x: Math.cos(hueAngleRad) * satRadius + radius,
		y: Math.sin(hueAngleRad) * satRadius + radius,
	}
    return result
})

function circleDegrees(deg) {
    return (deg + 360) % 360
}

function posToHueSat(x, y) {
	const radius = wheelDiameter.value / 2

	x -= radius
	y -= radius

	const angle = Math.atan2(y, x)
	const dist = Math.min(Math.sqrt(x * x + y * y), radius)

    const result = { hue: circleDegrees(90 + ((angle * 180) / Math.PI)), sat: (dist * 100) / radius }
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
	const rect = wheel.value.getBoundingClientRect()

	const localX = coords.clientX - rect.left
	const localY = coords.clientY - rect.top

	const hueSat = posToHueSat(localX, localY)
	emit("update:modelValue", { ...props.modelValue, ...hueSat })
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
.light-color-picker-wheel {
	position: relative;
	aspect-ratio: 1;
}

.hue-wheel {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	/*transform: rotateZ(210deg);*/
	border-radius: 100%;
	box-sizing: border-box;
	background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);
}

.saturation-wheel {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: 100%;
	background: radial-gradient(
		circle closest-side,
		rgb(255, 255, 255),
		transparent
	);
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
