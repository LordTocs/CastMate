<template>
	<base-obs-action-component :obs="model.obs">
		<div class="obs-data-text">{{ model.sourceName }}</div>
		<div class="flex-grow-1 flex flex-column align-items-center justify-content-center text-center obs-data-text">
			{{ model.text }}
		</div>
	</base-obs-action-component>
</template>

<script setup lang="ts">
import { Toggle } from "castmate-schema"
import BaseObsActionComponent from "./BaseObsActionComponent.vue"
import { computed } from "vue"

const model = defineModel<{
	obs: string
	sourceName: string
	text: string
}>({ required: true })
</script>

<style scoped></style>
