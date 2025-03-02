<template>
	<div class="flow-action-component flex flex-column align-items-center justify-content-center">
		<span class="probability-label">
			{{ ((model.weight / totalWeight) * 100).toLocaleString("en-Us", { maximumFractionDigits: 2 }) }}%
		</span>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const model = defineModel<{
	weight: number
}>({ required: true })

const props = defineProps<{
	subFlows: { weight: number }[]
}>()

const totalWeight = computed(() => {
	let total = 0
	for (const flow of props.subFlows) {
		if (flow?.weight == null) continue //Async issue I think?
		total += flow.weight
	}
	return total
})
</script>

<style scoped>
.flow-action-component {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
}

.probability-label {
	background-color: var(--darker-action-color);
	padding: 0.4rem;
	border-radius: var(--border-radius);
}
</style>
