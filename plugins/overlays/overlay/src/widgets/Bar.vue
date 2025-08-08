<template>
	<div
		class="outer-bar"
		:style="{
			...getBorderRadiusCSS(props.config.outerRadius),
			...getBackgroundCSS(props.config.backgroundStyle, mediaResolver),
		}"
	>
		<div
			class="inner-bar"
			:style="{
				width: `${percentage}%`,
				...getBackgroundCSS(props.config.fillStyle, mediaResolver),
			}"
		></div>
	</div>
</template>

<script setup lang="ts">
import { declareWidgetOptions, useMediaResolver } from "castmate-overlay-core"
import {
	getBackgroundCSS,
	getBorderRadiusCSS,
	WidgetBackgroundStyle,
	WidgetBorderRadius,
} from "castmate-plugin-overlays-shared"
import { computed } from "vue"

const mediaResolver = useMediaResolver()

const props = defineProps<{
	config: {
		value: number
		target: number
		outerRadius: WidgetBorderRadius
		backgroundStyle: WidgetBackgroundStyle
		fillStyle: WidgetBackgroundStyle
	}
}>()

const percentage = computed(() => {
	const valueNorm = props.config.value / props.config.target
	return Math.min(1, Math.max(0, valueNorm)) * 100
})

defineOptions({
	widget: declareWidgetOptions({
		id: "bar",
		name: "Bar",
		description: "Progress Bar",
		icon: "mdi mdi-square",
		defaultSize: {
			width: 400,
			height: 90,
		},
		config: {
			type: Object,
			properties: {
				value: { type: Number, name: "Value", required: true, default: 0, template: true },
				target: { type: Number, name: "Target", required: true, default: 100, template: true },
				outerRadius: { type: WidgetBorderRadius, name: "Outer Corners", required: true },
				backgroundStyle: { type: WidgetBackgroundStyle, name: "Background Style", required: true },
				fillStyle: { type: WidgetBackgroundStyle, name: "Fill Style", required: true },
			},
		},
	}),
})
</script>

<style scoped>
.outer-bar {
	position: relative;
	width: 100%;
	height: 100%;

	overflow: hidden;
}

.inner-bar {
	height: 100%;
	background-color: green;
}
</style>
