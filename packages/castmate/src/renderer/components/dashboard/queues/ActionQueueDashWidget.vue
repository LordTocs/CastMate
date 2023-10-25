<template>
	<div class="queue-card">
		<div class="queue-card-header">
			<h3 class="my-0">{{ queue.config.name }}</h3>
			<p-button
				plain
				size="small"
				text
				:icon="queue.config.paused ? 'mdi mdi-play' : 'mdi mdi-pause'"
				@click="togglePause"
			></p-button>
		</div>
		<div class="queue-list-outer">
			<div class="queue-list" @mousewheel="onScroll" ref="queueList">
				<div class="queue-history">
					<dash-queue-item
						v-for="historic in history"
						:key="historic.id"
						:queue-item="historic"
						state="history"
						@replay="replayItem(historic.id)"
					/>
				</div>
				<div class="queue-running-box">
					<dash-queue-item
						v-if="queue.state.running"
						:queue-item="queue.state.running"
						state="running"
						@skip="skip(queue.state.running.id)"
					/>
					<div v-else class="running-placeholder"></div>
				</div>
				<draggable-collection
					class="queued"
					v-model="queuedItems"
					key-prop="id"
					direction="horizontal"
					handle-class="queue-drag-handle"
					data-type="queued-sequence"
				>
					<template #item="{ item, index }">
						<dash-queue-item :queue-item="item" state="queued" @skip="skip(item.id)" />
					</template>
				</draggable-collection>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ActionQueueState, ActionQueueConfig, ResourceData } from "castmate-schema"
import { useResource, DraggableCollection, useResourceIPCCaller, useResourceStore } from "castmate-ui-core"

import DashQueueItem from "./DashQueueItem.vue"
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { settableArray } from "castmate-ui-core"

import PButton from "primevue/button"
import { QueuedSequence } from "castmate-schema"

const props = defineProps<{
	queueId: string
}>()

const queue = useResource<ResourceData<ActionQueueConfig, ActionQueueState>>("ActionQueue", () => props.queueId)

const spliceQueue = useResourceIPCCaller<(index: number, deleteCount: number, ...sequence: QueuedSequence[]) => any>(
	"ActionQueue",
	() => props.queueId,
	"spliceQueue"
)

const queuedItems = settableArray({
	get() {
		return queue.value.state.queue
	},
	set(v) {},
	setItem(index, v) {},
	splice(index, deleteCount, ...items) {
		return spliceQueue(index, deleteCount, ...items)
	},
	push(v) {},
})

const history = computed(() => {
	return queue.value.state.history.reverse()
})

const queueList = ref<HTMLElement>()

function onScroll(ev: WheelEvent) {
	if (!queueList.value) return

	queueList.value.scrollLeft -= ev.deltaY
}

function convertRemToPixels(rem: number) {
	return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

watch(
	() => queue.value.state.history,
	(current, old) => {
		if (current.length > old.length) {
			nextTick(() => {
				if (!queueList.value) return
				console.log("Shifting!", queueList.value.scrollLeft)
				queueList.value.scrollLeft += convertRemToPixels(10.5)
			})
		}
	}
)

onMounted(() => {
	if (!queueList.value) return
	queueList.value.scrollLeft = queue.value.state.history.length * convertRemToPixels(10.5)
})

const skipItem = useResourceIPCCaller<(id: string) => any>("ActionQueue", () => props.queueId, "skip")
async function skip(id: string) {
	await skipItem(id)
}

const replayItem = useResourceIPCCaller<(id: string) => any>("ActionQueue", () => props.queueId, "replay")
async function replay(id: string) {
	await replayItem(id)
}

const resourceStore = useResourceStore()
function togglePause() {
	resourceStore.applyResourceConfig("ActionQueue", props.queueId, {
		paused: !queue.value.config.paused,
	})
}
</script>

<style scoped>
.queue-card {
	--queue-height: 150px;
	--queue-item-width: 10rem;
	padding: 0.5rem;
	display: flex;
	flex-direction: column;
	border-radius: var(--border-radius);
	background-color: grey;
}

.queue-list-outer {
	position: relative;
	height: calc(var(--queue-height) + 2.5rem);
}

.running-placeholder {
	width: var(--queue-item-width);
	height: var(--queue-height);
	flex-shrink: 0;
}

.queue-running-box {
	padding: 0.25rem;
	border-radius: var(--border-radius);
	border: dashed 2px white;
	display: flex;
	flex-direction: row;
	align-items: center;
}

.queue-list {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 0.5rem;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	position: absolute;
	overflow-x: scroll;
	overflow-y: hidden;
}

.queue-history {
	display: flex;
	flex-direction: row;
	gap: 0.5rem;
	align-items: center;
}

.queued {
	gap: 0.5rem;
	min-width: calc(100% - var(--queue-item-width) - 1.75rem);
	min-height: var(--queue-height);
}

.queue-content {
	display: flex;
	flex-direction: row;
	gap: 0.5rem;
}

.queue-card-header {
	display: flex;
	flex-direction: row;
	align-items: center;
}
</style>
