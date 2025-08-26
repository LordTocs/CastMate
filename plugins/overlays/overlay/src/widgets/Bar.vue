<template>
	<div
		class="outer-bar"
		:style="{
			flexDirection,
			...getBorderRadiusCSS(props.config.outerRadius),
			...getBackgroundCSS(props.config.backgroundStyle, mediaResolver),
			...getOutlineCSS(props.config.outline),
		}"
	>
		<div
			class="inner-bar"
			:style="{
				...fillPositionStyle,
				...fillLineStyle,
				...getBackgroundCSS(props.config.fillStyle, mediaResolver),
			}"
		></div>
	</div>
</template>

<script setup lang="ts">
import { declareWidgetOptions, useMediaResolver } from "castmate-overlay-core"
import {
	getBackgroundCSS,
	getBorderCSS,
	getBorderRadiusCSS,
	getOutlineCSS,
	WidgetBackgroundStyle,
	WidgetBorderRadius,
	WidgetBorderStyle,
	WidgetOutlineStyle,
} from "castmate-plugin-overlays-shared"
import { computed, CSSProperties } from "vue"

const mediaResolver = useMediaResolver()

const props = defineProps<{
	config: {
		value: number
		target: number
		direction: "Right" | "Left" | "Up" | "Down"
		outerRadius: WidgetBorderRadius
		backgroundStyle: WidgetBackgroundStyle
		outline: WidgetOutlineStyle
		fillStyle: WidgetBackgroundStyle
		fillLine: WidgetOutlineStyle
	}
}>()

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
				value: { type: Number, name: "Value", required: true, default: 25, template: true },
				target: { type: Number, name: "Target", required: true, default: 100, template: true },
				direction: {
					type: String,
					name: "Direction",
					required: true,
					default: "Right",
					enum: ["Right", "Left", "Up", "Down"],
				},
				outerRadius: { type: WidgetBorderRadius, name: "Outer Corners", required: true },
				backgroundStyle: {
					type: WidgetBackgroundStyle,
					name: "Background Style",
					required: true,
					default: { color: "#FF0000", elements: [] },
				},
				outline: { type: WidgetOutlineStyle, name: "Outline" },
				fillStyle: {
					type: WidgetBackgroundStyle,
					name: "Fill Style",
					required: true,
					default: { color: "#00FF00", elements: [] },
				},
				fillLine: { type: WidgetOutlineStyle, name: "Fill Line" },
			},
		},
	}),
})

const isVertical = computed(() => props.config.direction == "Up" || props.config.direction == "Down")
const isReverse = computed(() => props.config.direction == "Left" || props.config.direction == "Up")

const flexDirection = computed(() => {
	if (isVertical.value) {
		if (isReverse.value) {
			return "column-reverse"
		} else {
			return "column"
		}
	} else {
		if (isReverse.value) {
			return "row-reverse"
		} else {
			return "row"
		}
	}
})

const fillPositionStyle = computed<CSSProperties>(() => {
	if (isVertical.value) {
		return {
			height: `${percentage.value}%`,
			width: `100%`,
		}
	} else {
		return {
			width: `${percentage.value}%`,
			height: `100%`,
		}
	}
})

const fillLineStyle = computed<CSSProperties>(() => {
	const borderStyle: Partial<WidgetBorderStyle> = {}

	if (isVertical.value) {
		if (isReverse.value) {
			borderStyle.top = props.config.fillLine
		} else {
			borderStyle.bottom = props.config.fillLine
		}
	} else {
		if (isReverse.value) {
			borderStyle.left = props.config.fillLine
		} else {
			borderStyle.right = props.config.fillLine
		}
	}

	return getBorderCSS(borderStyle)
})

const percentage = computed(() => {
	const valueNorm = props.config.value / props.config.target
	return Math.min(1, Math.max(0, valueNorm)) * 100
})
</script>

<style scoped>
.outer-bar {
	position: relative;
	width: 100%;
	height: 100%;

	overflow: hidden;

	display: flex;
}
</style>
