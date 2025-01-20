<template>
	<base-obs-action-component :obs="model.obs">
		<div class="obs-data-text">{{ model.sourceName }}</div>
		<i class="mdi mdi-refresh" />
	</base-obs-action-component>
</template>

<script setup lang="ts">
import { Toggle } from "castmate-schema"
import BaseObsActionComponent from "./BaseObsActionComponent.vue"
import { computed } from "vue"

const model = defineModel<{
	obs: string
	sourceName: string
}>({ required: true })
</script>

<style scoped></style>
