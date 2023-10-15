<template>
	<div class="queue-item" :style="{ ...triggerColorStyle }">
		<h3><i :class="queuedTrigger?.icon" /> {{ queuedTrigger?.name }}</h3>
		<p-button text icon="mdi mdi-skip-next" @click="skip"></p-button>
	</div>
</template>

<script setup lang="ts">
import { QueuedSequence, ResourceData, ProfileConfig } from "castmate-schema"
import { useColors, useResourceData, useTrigger, useTriggerColors } from "castmate-ui-core"
import PButton from "primevue/button"
import { computed } from "vue"

const props = defineProps<{
	queueItem: QueuedSequence
}>()

const profiles = useResourceData<ResourceData<ProfileConfig>>("Profile")

const queuedTriggerData = computed(() => {
	if (props.queueItem.source.type != "profile") return undefined

	const profile = profiles.value?.resources?.get(props.queueItem.source.id)

	if (!profile) {
		console.error("Unable to find profile", props.queueItem.source.id)
		return undefined
	}

	console.log("Has Profile")

	const trigger = profile.config.triggers.find((t) => t.id == props.queueItem.source.subid)

	return trigger
})

const queuedTrigger = useTrigger(() => queuedTriggerData.value)
const { triggerColorStyle } = useTriggerColors(() => queuedTriggerData.value)

function skip() {}
</script>

<style scoped>
.queue-item {
	border-radius: var(--border-radius);
	width: 10rem;
	height: 15rem;

	background-color: var(--trigger-color);
	border: solid 2px var(--lighter-trigger-color);
}
</style>
