<template>
	<div class="queue-item" :style="{ ...triggerColorStyle }">
		<div class="item-header" :class="{ 'queue-drag-handle': state == 'queued' }">
			<i v-if="state == 'queued'" class="mdi mdi-drag"></i>
			<span v-else>&nbsp;</span>
			<i :class="queuedTrigger?.icon" /> {{ queuedTrigger?.name }}
		</div>

		<div class="data">
			<data-view
				:model-value="queueItem.queueContext.contextState"
				v-if="queuedContextSchema"
				:schema="queuedContextSchema"
			/>
		</div>

		<div class="controls">
			<p-button
				text
				plain
				icon="mdi mdi-skip-next"
				size="small"
				@click="emit('skip')"
				v-if="state == 'queued' || state == 'running'"
			></p-button>

			<p-button
				text
				icon="mdi mdi-replay"
				size="small"
				@click="emit('replay')"
				plain
				v-if="state == 'history'"
			></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { asyncComputed } from "@vueuse/core"
import { QueuedSequence, ResourceData, ProfileConfig } from "castmate-schema"
import {
	useColors,
	useResourceData,
	useResourceIPCCaller,
	useTrigger,
	useTriggerColors,
	DataView,
} from "castmate-ui-core"
import PButton from "primevue/button"
import { computed } from "vue"
import { isFunction } from "lodash"

const props = defineProps<{
	queueItem: QueuedSequence
	state: "history" | "running" | "queued"
}>()

const profiles = useResourceData<ResourceData<ProfileConfig>>("Profile")

const emit = defineEmits(["skip", "replay"])

const queuedTriggerData = computed(() => {
	if (props.queueItem.source.type != "profile") return undefined

	const profile = profiles.value?.resources?.get(props.queueItem.source.id)

	if (!profile) {
		console.error("Unable to find profile", props.queueItem.source.id)
		return undefined
	}

	const trigger = profile.config.triggers.find((t) => t.id == props.queueItem.source.subId)

	return trigger
})

const queuedTrigger = useTrigger(() => queuedTriggerData.value)
const { triggerColorStyle } = useTriggerColors(() => queuedTriggerData.value)

const queuedContextSchema = asyncComputed(async () => {
	if (isFunction(queuedTrigger.value?.context)) {
		return await queuedTrigger.value.context(queuedTriggerData.value?.config)
	}
	return queuedTrigger.value?.context
})
</script>

<style scoped>
.queue-item {
	border-radius: var(--border-radius);
	width: var(--queue-item-width);
	height: var(--queue-height);
	flex-shrink: 0;

	background-color: var(--trigger-color);
	border: solid 2px var(--lighter-trigger-color);

	display: flex;
	flex-direction: column;
}

.controls {
	display: flex;
	flex-direction: row;
}

.item-header {
	background-color: var(--darker-trigger-color);
	white-space: nowrap;
	overflow: hidden;
}

.queue-drag-handle {
	cursor: grab;
}

.item-title {
	margin: 0;
}

.data {
	flex: 1;
}
</style>
