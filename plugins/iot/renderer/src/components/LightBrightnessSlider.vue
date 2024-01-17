<template>
	<div
		class="light-brightness-slider"
		:style="{
			backgroundImage: brightnessGradient,
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
import { ref, computed, useModel } from "vue"
import { LightColor, LightColorObj } from "castmate-plugin-iot-shared"
import { Color } from "castmate-schema"
import { useEventListener } from "@vueuse/core"

const props = defineProps<{
	modelValue: LightColor | undefined
}>()

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
		console.log("New Value", v)
		model.value = LightColor.serialize(v)
	},
})

const fullBrightness = computed(() => {
	if (parsedModel.value == null) return "#FFFFFF" as Color

	if ("hue" in parsedModel.value) {
		return LightColor.toColor(
			LightColor.serialize({ hue: parsedModel.value.hue, sat: parsedModel.value.sat, bri: 100 })
		)
	} else {
		return LightColor.toColor(LightColor.serialize({ kelvin: parsedModel.value.kelvin, bri: 100 }))
	}
})

const brightnessGradient = computed(() => {
	return `linear-gradient(180deg, #000000, ${fullBrightness})`
})

const brightness = computed({
	get() {
		return parsedModel.value?.bri ?? 100
	},
	set(v) {
		parsedModel.value = { ...(parsedModel.value ?? { hue: 0, sat: 100 }), bri: parsedModel.value?.bri ?? 100 }
	},
})

const dotPos = computed(() => {
	return brightness.value / 100
})

const slider = ref<HTMLElement>()
const sliderHeight = computed(() => {
	if (!slider.value) return 0
	const rect = slider.value.getBoundingClientRect()
	return rect.bottom - rect.top
})

function posToBrightness(x: number, y: number) {
	const height = sliderHeight.value

	y = Math.max(0, Math.min(height, y))

	const result = y / height
	return result
}
const dragging = ref(false)

function onMouseDown(ev: MouseEvent) {
	if (ev.button == 0) {
		ev.preventDefault()
		ev.stopPropagation()
		dragging.value = true
	}
}

useEventListener(
	() => (dragging.value ? window : undefined),
	"mousemove",
	(ev: MouseEvent) => {
		if (!slider.value) return
		const rect = slider.value.getBoundingClientRect()

		const localX = ev.clientX - rect.left
		const localY = ev.clientY - rect.top

		console.log("Move", localX, localY)
		brightness.value = posToBrightness(localX, localY)
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
.light-brightness-slider {
	position: relative;
	aspect-ratio: 0.15;
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
