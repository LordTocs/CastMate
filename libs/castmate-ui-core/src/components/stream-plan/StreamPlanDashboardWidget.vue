<template>
	<main-page-card class="flex-1" style="min-width: 380px">
		<template #header> <i class="mdi mdi-view-agenda" /> Stream Plan </template>

		<div class="flex-1 flex flex-column gap-2">
			<div class="flex flex-row">
				<div class="w-full flex-1">
					<data-input
						:no-float="true"
						v-model="planId"
						:disabled="hasActivePlan"
						:schema="planSchema"
						local-path="plan"
					/>
				</div>
				<p-button
					@click="planToggle"
					:severity="hasActivePlan ? 'danger' : 'success'"
					:icon="hasActivePlan ? 'mdi mdi-stop' : 'mdi mdi-play'"
				></p-button>
			</div>
			<div class="plan-segments">
				<div class="segment-scroller-outer">
					<div class="segment-scroller" @mousewheel="onScroll" ref="segmentList">
						<template v-if="selectedPlan">
							<stream-plan-dashboard-segment
								v-for="segment in selectedPlan.config.segments"
								:key="segment.id"
								:segment="segment"
								:plan-id="planId"
								:activePlan="hasActivePlan"
							/>
						</template>
					</div>
				</div>
			</div>
		</div>
	</main-page-card>
</template>

<script setup lang="ts">
import { ResourceData, StreamPlanConfig, StreamPlanState, declareSchema } from "castmate-schema"
import MainPageCard from "../main-page/MainPageCard.vue"
import DataInput from "../data/DataInput.vue"
import { ResourceProxyFactory, usePropagationStop, useResourceData } from "../../main"
import { computed, onMounted, ref, watch } from "vue"
import StreamPlanDashboardSegment from "./StreamPlanDashboardSegment.vue"
import { useStreamPlanStore } from "./stream-plan-types"

import PButton from "primevue/button"

const planSchema = declareSchema({
	type: ResourceProxyFactory,
	resourceType: "StreamPlan",
	name: "Plan",
})

const planId = ref<string>()

const plans = useResourceData<ResourceData<StreamPlanConfig, StreamPlanState>>("StreamPlan")

const streamPlanStore = useStreamPlanStore()

const selectedPlan = computed(() => {
	if (!planId.value) return undefined
	return plans.value?.resources?.get?.(planId.value)
})

const stopPropagation = usePropagationStop()

const segmentList = ref<HTMLElement>()
function onScroll(ev: WheelEvent) {
	if (!segmentList.value) return

	if (ev.deltaY > 0) {
		const maxScrollLeft = segmentList.value.scrollWidth - segmentList.value.clientWidth
		if (segmentList.value.scrollLeft >= maxScrollLeft) return
	} else if (ev.deltaY < 0) {
		if (segmentList.value.scrollLeft <= 0) return
	}

	segmentList.value.scrollLeft += ev.deltaY / 2
	stopPropagation(ev)
	ev.preventDefault()
}

const hasActivePlan = computed(() => {
	return streamPlanStore.activePlan != null
})

onMounted(() => {
	watch(
		() => streamPlanStore.activePlan,
		() => {
			planId.value = streamPlanStore.activePlan?.id
		},
		{ immediate: true }
	)
})

function planToggle() {
	if (!hasActivePlan.value) {
		streamPlanStore.setActivePlan(planId.value)
	} else {
		streamPlanStore.setActivePlan(undefined)
	}
}
</script>

<style scoped>
.plan-segments {
	width: 100%;
	border-radius: var(--border-radius);
	border: solid 1px var(--surface-border);
	padding: 0.25rem;
	flex-grow: 1;
	height: 20rem;
}

.segment-scroller-outer {
	position: relative;
	flex-grow: 1;
	height: 100%;
}

.segment-scroller {
	display: flex;
	flex-direction: row;
	overflow-x: scroll;
	overflow-y: hidden;
	gap: 0.25rem;
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
}
</style>
