<template>
	<div class="flex flex-row w-full">
		<div class="drag-handle">
			<i class="text-color-secondary mdi mdi-drag" style="font-size: 2rem"></i>
		</div>
		<div class="flex flex-row flex-1 align-items-center justify-content-center w-0">
			<widget-image-background-edit v-if="isWidgetBackgroundImage(model)" v-model="model" />
			<widget-gradient-background-edit v-if="isWidgetBackgroundGradient(model)" v-model="model" />
		</div>
		<div>
			<p-button icon="mdi mdi-delete" @click="emit('delete')" text></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	isWidgetBackgroundGradient,
	isWidgetBackgroundImage,
	WidgetBackgroundStyleElement,
} from "castmate-plugin-overlays-shared"
import PButton from "primevue/button"
import WidgetGradientBackgroundEdit from "./WidgetGradientBackgroundEdit.vue"
import WidgetImageBackgroundEdit from "./WidgetImageBackgroundEdit.vue"
import { computed } from "vue"

const props = defineProps<{}>()

const emit = defineEmits(["delete"])

const model = defineModel<WidgetBackgroundStyleElement>({ required: true })
</script>

<style scoped></style>
