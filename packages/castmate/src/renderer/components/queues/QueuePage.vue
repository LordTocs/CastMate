<template>
	<flex-scroller>
		<p-button @click="newQueue">Add Queue</p-button>
		<div v-for="queue of queueList" class="queue">
			<span>
				<span class="text-2xl">{{ queue.config.name }}</span>
				<span class="text-lg">&nbsp;{{ queue.config.paused ? "Paused" : "Running" }}</span>
			</span>
			<div class="queue-items">
				<queue-item v-if="queue.state.running" :queue-item="queue.state.running" />
				<queue-item v-for="queueItem of queue.state.queue" :queue-item="queueItem" :key="queueItem.id" />
			</div>
		</div>
		<p-button @click="newQueue" v-if="queueList.length > 0">Add Queue</p-button>
	</flex-scroller>
</template>

<script setup lang="ts">
import { FlexScroller, useResourceStore, useResourceData } from "castmate-ui-core"
import { ActionQueueState, ActionQueueConfig, ResourceData } from "castmate-schema"
import { computed } from "vue"
import { useDialog } from "primevue/usedialog"
import PButton from "primevue/button"
import QueueEditDialog from "./QueueEditDialog.vue"
import QueueItem from "./QueueItem.vue"

const queues = useResourceData<ResourceData<ActionQueueConfig, ActionQueueState>>("ActionQueue")
const dialog = useDialog()

const resourceStore = useResourceStore()

const queueList = computed(() => [...(queues.value?.resources?.values() ?? [])])

function newQueue() {
	dialog.open(QueueEditDialog, {
		props: {
			header: `Create Queue?`,
			style: {
				width: "25vw",
			},
			modal: true,
		},
		onClose(options) {
			if (!options) {
				return
			}

			if (!options.data) return

			resourceStore.createResource("ActionQueue", options.data)
		},
	})
}
</script>

<style scoped>
.queue {
	border-radius: var(--border-radius);
	background-color: var(--surface-100);
	padding: 0.25rem 1rem;
}

.queue:not(:last-child) {
	padding-bottom: 2rem;
}

.queue h2 {
	margin-top: 0;
	margin-bottom: 0.5rem;
}
.queue h3 {
	margin-top: 0;
}

.queue-items {
	display: flex;
	flex-direction: row;
	overflow-x: auto;
	min-height: 16rem;
}
</style>
