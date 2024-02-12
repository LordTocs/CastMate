<template>
	<p class="overlay-label">{{ message }}</p>
</template>

<script setup lang="ts">
import { declareWidgetOptions } from "castmate-overlay-core"
import { ResolvedSchemaType } from "castmate-schema"
import { defineAsyncComponent } from "vue"

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
	widget: widgetOptions,
})
const props = defineProps<ResolvedSchemaType<typeof widgetOptions.config>>()
</script>

<style scoped>
.overlay-label {
	white-space: pre-wrap;
}
</style>
