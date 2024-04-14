<template>
	<div class="light-color-picker-wheel" ref="wheel" @mousedown="onMouseDown">
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

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, useModel } from "vue"
import { HSB, HSBColor, LightColor, LightColorObj } from "castmate-plugin-iot-shared"
import { useEventListener, useElementSize } from "@vueuse/core"
import { usePropagationStop } from "castmate-ui-core"
const props = defineProps<{
	modelValue: LightColor | undefined
}>()

const emit = defineEmits(["update:modelValue"])

const wheel = ref<HTMLElement>()

const wheelSize = useElementSize(wheel)

const model = useModel(props, "modelValue")
const parsedModel = computed<LightColorObj | undefined>({
	get() {
		if (model.value == null) return undefined
		return LightColor.parse(model.value)
	},
	set(v) {
		if (v == null) {
			model.value = undefined
			return
		}
		model.value = LightColor.serialize(v)
	},
})

const defaultHue = 0
const defaultSat = 100
const defaultBri = 100

const bri = computed(() => parsedModel.value?.bri ?? defaultBri)

const hue = computed(() => {
	if (!parsedModel.value) return defaultHue
	if (!("hue" in parsedModel.value)) return defaultHue
	return parsedModel.value.hue
})

const sat = computed(() => {
	if (!parsedModel.value) return defaultSat
	if (!("sat" in parsedModel.value)) return defaultSat
	return parsedModel.value.sat
})

const dotPosition = computed(() => {
	const hueAngleRad = ((hue.value - 90) * Math.PI) / 180
	const radius = wheelSize.width.value / 2
	const satRadius = (sat.value * radius) / 100
	const result = {
		x: Math.cos(hueAngleRad) * satRadius + radius,
		y: Math.sin(hueAngleRad) * satRadius + radius,
	}
	return result
})

function circleDegrees(deg: number) {
	return (deg + 360) % 360
}

function posToHueSat(x: number, y: number) {
	const radius = wheelSize.width.value / 2

	x -= radius
	y -= radius

	const angle = Math.atan2(y, x)
	const dist = Math.min(Math.sqrt(x * x + y * y), radius)

	const result = {
		hue: circleDegrees(90 + (angle * 180) / Math.PI),
		sat: (dist * 100) / radius,
	}
	return result
}

const dragging = ref(false)

const stopPropagation = usePropagationStop()

function onMouseDown(ev: MouseEvent) {
	ev.preventDefault()
	stopPropagation(ev)
	dragging.value = true
}

useEventListener(
	() => (dragging.value ? window : undefined),
	"mousemove",
	(ev: MouseEvent) => {
		if (!wheel.value) return

		const rect = wheel.value.getBoundingClientRect()

		const localX = ev.clientX - rect.left
		const localY = ev.clientY - rect.top

		parsedModel.value = { ...posToHueSat(localX, localY), bri: bri.value }
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
	background: radial-gradient(circle closest-side, rgb(255, 255, 255), transparent);
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
