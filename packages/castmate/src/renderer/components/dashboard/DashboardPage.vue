<template>
	<div class="container">
		<action-queue-dash-widget v-for="queue in queues" :key="queue.id" :queue-id="queue.id" />
	</div>
</template>

<script setup lang="ts">
import { useResourceArray } from "castmate-ui-core"
import ActionQueueDashWidget from "./queues/ActionQueueDashWidget.vue"

const queues = useResourceArray("ActionQueue")
</script>

<style scoped>
.container {
	position: relative;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 0.5rem;
}
</style>
