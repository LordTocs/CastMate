<template>
	<base-obs-action-component :obs="model.obs">
		<div class="flex flex-column text-center obs-data-text">
			<span>{{ model.source }}</span>
		</div>
		<i :class="icon" />
	</base-obs-action-component>
</template>

<script setup lang="ts">
import { Toggle } from "castmate-schema"
import BaseObsActionComponent from "./BaseObsActionComponent.vue"
import { computed } from "vue"

const model = defineModel<{
	obs: string
	source: string
	action: "Play" | "Pause" | "Restart" | "Stop" | "Next" | "Previous" | undefined
}>({ required: true })

const icon = computed(() => {
	switch (model.value.action) {
		case "Play":
			return "mdi mdi-play"
		case "Pause":
			return "mdi mdi-pause"
		case "Restart":
			return "mdi mdi-restart"
		case "Stop":
			return "mdi mdi-stop"
		case "Next":
			return "mdi mdi-skip-next"
		case "Previous":
			return "mdi mdi-skip-previous"
	}
	return "mdi mdi-square"
})
</script>

<style scoped></style>
