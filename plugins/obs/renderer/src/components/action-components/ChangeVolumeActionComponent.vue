<template>
	<base-obs-action-component :obs="model.obs">
		<div class="flex flex-column obs-data-text">
			<span>{{ model.source }}</span>
		</div>

		<div class="meter mt-1">
			<div class="meter-inner" :style="{ width: `${model.volume}%` }"></div>
		</div>
	</base-obs-action-component>
</template>

<script setup lang="ts">
import { Toggle } from "castmate-schema"
import BaseObsActionComponent from "./BaseObsActionComponent.vue"
import { computed } from "vue"

const model = defineModel<{
	obs: string
	source: string
	volume: number
}>({ required: true })
</script>

<style scoped>
.meter {
	height: 1rem;
	width: 80%;
	position: relative;
	background-color: #ffffff80;
	border-radius: var(--border-radius);
	overflow: hidden;
}

.meter-inner {
	height: 1rem;
	background-color: white;
}
</style>
