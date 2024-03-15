<template>
	<p class="overlay-label">{{ config.message }}</p>
</template>

<script setup lang="ts">
import { declareWidgetOptions } from "castmate-overlay-core"
import { ResolvedSchemaType, declareSchema } from "castmate-schema"
import { defineAsyncComponent, getCurrentInstance } from "vue"

const widgetOptions = declareWidgetOptions({
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
				type: String,
				required: true,
				default: "",
				template: true,
			},
		},
	},
})

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
					type: String,
					required: true,
					default: "",
					template: true,
				},
			},
		},
	}),
})

//Vue compiler is too stupid to compile this?
//const props = defineProps<ResolvedSchemaType<typeof widgetOptions.config>>()
const props = defineProps<{ config: { message: string } }>()
</script>

<style scoped>
.overlay-label {
	white-space: pre-wrap;
}
</style>
