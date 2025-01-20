<template>
	<base-obs-action-component :obs="model.obs">
		<obs-source-ref :obs="model.obs" :scene="model.scene" :source="model.source" />
		<div>
			<i :class="icon" />
		</div>
	</base-obs-action-component>
</template>

<script setup lang="ts">
import { Toggle } from "castmate-schema"
import BaseObsActionComponent from "./BaseObsActionComponent.vue"
import ObsSourceRef from "./ObsSourceRef.vue"
import { computed } from "vue"

const model = defineModel<{
	obs: string | undefined
	scene: string | undefined
	source: number | undefined
	enabled: Toggle | undefined
}>({ required: true })

const icon = computed(() => {
	if (model.value.enabled === true) {
		return "mdi mdi-eye-outline"
	} else if (model.value.enabled === false) {
		return "mdi mdi-eye-off-outline"
	}
	return "mdi mdi-swap-horizontal"
})
</script>

<style scoped></style>
