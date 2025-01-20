<template>
	<base-obs-action-component :obs="model.obs">
		<div class="flex flex-column obs-data-text">
			<span>{{ model.sourceName }}</span>
			<span>{{ model.filterName }}</span>
		</div>
		<div>
			<i :class="icon" />
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
	filterName: string
	filterEnabled: Toggle
}>({ required: true })

const icon = computed(() => {
	if (model.value.filterEnabled === true) {
		return "mdi mdi-eye-outline"
	} else if (model.value.filterEnabled === false) {
		return "mdi mdi-eye-off-outline"
	}
	return "mdi mdi-swap-horizontal"
})
</script>

<style scoped></style>
