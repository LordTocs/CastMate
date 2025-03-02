<template>
	<div class="color-picker-wheel" ref="wheel" @mousedown="onMouseDown">
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
import { useEventListener, useElementSize } from "@vueuse/core"
import { useCommitUndo, usePropagationStop } from "../../../../main"
import { Color } from "castmate-schema"
import { useColorProperties } from "./color-utils"
import * as chromatism from "chromatism2"

const props = defineProps<{}>()

const emit = defineEmits(["update:modelValue"])

const wheel = ref<HTMLElement>()

const wheelSize = useElementSize(wheel)

const model = defineModel<Color>()

const { hue, sat, val } = useColorProperties(model)

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

const commitUndo = useCommitUndo()

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

		const result = posToHueSat(localX, localY)

		const hex = chromatism.convert({ h: result.hue, s: result.sat, v: val.value }).hex
		//@ts-ignore
		model.value = hex
	}
)

useEventListener(
	() => (dragging.value ? window : undefined),
	"mouseup",
	(ev: MouseEvent) => {
		dragging.value = false
		commitUndo()
	}
)
</script>

<style scoped>
.color-picker-wheel {
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
