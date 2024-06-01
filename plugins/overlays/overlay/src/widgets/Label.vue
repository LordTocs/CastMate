<template>
	<div
		class="overlay-label"
		:style="{
			...OverlayTextStyle.toCSSProperties(config.font),
			...OverlayBlockStyle.toCSSProperties(config.block),
		}"
	>
		<div
			:style="{
				whiteSpace: 'break-spaces',
				width: '100%',
				...OverlayTextAlignment.toCSSProperties(config.textAlign),
			}"
		>
			{{ config.message }}
		</div>
	</div>
</template>

<script setup lang="ts">
import { declareWidgetOptions } from "castmate-overlay-core"
import { OverlayBlockStyle, OverlayTextAlignment, OverlayTextStyle } from "castmate-plugin-overlays-shared"

defineOptions({
	widget: declareWidgetOptions({
		id: "label",
		name: "Label",
		description: "Puts some text in the overlay",
		icon: "mdi mdi-cursor-text",
		defaultSize: {
			width: 300,
			height: 200,
		},
		config: {
			type: Object,
			properties: {
				message: {
					name: "Text",
					type: String,
					required: true,
					default: "Label",
					template: true,
					multiLine: true,
				},
				font: {
					name: "Font",
					type: OverlayTextStyle,
					required: true,
				},
				textAlign: {
					type: OverlayTextAlignment,
					name: "Text Align",
					required: true,
				},
				block: {
					name: "Block",
					type: OverlayBlockStyle,
					required: true,
					allowMargin: false,
					allowPadding: false,
					allowHorizontalAlign: false,
				},
			},
		},
	}),
})

//Vue compiler is too stupid to compile this?
//const props = defineProps<ResolvedSchemaType<typeof widgetOptions.config>>()
const props = defineProps<{
	config: { message: string; font: OverlayTextStyle; textAlign: OverlayTextAlignment; block: OverlayBlockStyle }
}>()
</script>

<style scoped>
.overlay-label {
	width: 100%;
	height: 100%;
}
</style>
