<template>
	<base-obs-action-component :obs="model.obs">
		<div class="obs-data-text text-center">{{ model.sourceName }}</div>
		<i class="mdi mdi-camera" />
		<div class="obs-data-text text-center">{{ model.filename }}</div>
	</base-obs-action-component>
</template>

<script setup lang="ts">
import BaseObsActionComponent from "./BaseObsActionComponent.vue"

const model = defineModel<{
	obs: string
	sourceName: string
	filename: string
}>({ required: true })
</script>

<style scoped></style>
