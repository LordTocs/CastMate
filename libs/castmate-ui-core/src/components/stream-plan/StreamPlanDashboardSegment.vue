<template>
	<div class="segment flex flex-column" :class="{ active }">
		<div class="flex-grow-1">
			<div class="text-center">
				{{ props.segment.name }}
			</div>
			<div class="flex flex-row">
				<div class="flex-grow-1">
					<div class="text-center">
						<label class="text-color-secondary text-xs">Activation</label>
					</div>
					<sequence-mini-preview :sequence="segment.activationAutomation.sequence" :max-length="3" />
				</div>
				<div class="flex-grow-1">
					<div class="text-center">
						<label class="text-color-secondary text-xs">Deactivation</label>
					</div>
					<sequence-mini-preview :sequence="segment.deactivationAutomation.sequence" :max-length="3" />
				</div>
			</div>
		</div>
		<div class="controls flex flex-row">
			<p-button
				size="small"
				icon="mdi mdi-play"
				:disabled="!activePlan"
				@click="activate"
				severity="success"
			></p-button>
			<div class="flex-grow-1" />
			<p-button size="small" text icon="mdi mdi-pencil" @click="edit"></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { StreamPlanSegment } from "castmate-schema"
import PButton from "primevue/button"

import SequenceMiniPreview from "../automation/mini/SequenceMiniPreview.vue"
import { useStreamPlanStore, useSegmentEditDialog } from "./stream-plan-types"
import { computed } from "vue"

const planStore = useStreamPlanStore()

const active = computed(() => {
	return planStore.activeSegment?.id == props.segment.id
})

const props = defineProps<{
	planId?: string
	segment: StreamPlanSegment
	activePlan: boolean
}>()

const editSegment = useSegmentEditDialog()

function edit() {
	if (!props.planId) return
	editSegment(props.planId, props.segment.id)
}

function activate() {
	planStore.setActiveSegment(props.segment.id)
}
</script>

<style scoped>
.segment {
	border-radius: var(--border-radius);
	border: solid 1px var(--surface-border);
	padding: 0.25rem;
	width: 15rem;
	flex-shrink: 0;
}

.segment.active {
	border-color: var(--success-color);
}
</style>
