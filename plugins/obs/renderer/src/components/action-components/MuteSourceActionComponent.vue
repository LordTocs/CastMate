<template>
	<base-obs-action-component :obs="model.obs">
		<div class="flex flex-column">
			{{ model.source }}
		</div>
		<i :class="icon" />
	</base-obs-action-component>
</template>

<script setup lang="ts">
import BaseObsActionComponent from "./BaseObsActionComponent.vue"
import { Toggle } from "castmate-schema"
import { computed } from "vue"

const model = defineModel<{
	obs: string
	source: string
	muted: Toggle
}>({ required: true })

const icon = computed(() => {
	if (model.value.muted === true) {
		return "mdi mdi-volume-off"
	} else if (model.value.muted === false) {
		return "mdi mdi-volume-high"
	}
	return "mdi mdi-swap-horizontal"
})
</script>
