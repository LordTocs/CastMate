<template>
	<p class="overlay-label" :style="{ ...OverlayTextStyle.toCSSProperties(config.font) }">{{ config.message }}</p>
</template>

<script setup lang="ts">
import { declareWidgetOptions } from "castmate-overlay-core"
import { OverlayTextStyle } from "castmate-plugin-overlays-shared"

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
					default: "",
					template: true,
				},
				font: {
					name: "Font",
					type: OverlayTextStyle,
					required: true,
				},
			},
		},
	}),
})

//Vue compiler is too stupid to compile this?
//const props = defineProps<ResolvedSchemaType<typeof widgetOptions.config>>()
const props = defineProps<{ config: { message: string; font: OverlayTextStyle } }>()
</script>

<style scoped>
.overlay-label {
	white-space: pre-wrap;
}
</style>
