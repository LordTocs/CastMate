<template>
	<base-obs-action-component :obs="model.obs">
		<i class="mdi mdi-map-marker" />
	</base-obs-action-component>
</template>

<script setup lang="ts">
import { Toggle } from "castmate-schema"
import BaseObsActionComponent from "./BaseObsActionComponent.vue"
import { computed } from "vue"

const model = defineModel<{
	obs: string
	chapterName: string
}>({ required: true })
</script>

<style scoped></style>
