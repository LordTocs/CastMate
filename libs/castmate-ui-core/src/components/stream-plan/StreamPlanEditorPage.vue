<template>
	<scrolling-tab-body v-model:scroll-x="view.scrollX" v-model:scroll-y="view.scrollY">
		<document-data-collection
			v-model="model.segments"
			v-model:view="view.segments"
			local-path="segments"
			:data-component="StreamPlanSegmentEdit"
		>
			<template #header>
				<div class="flex flex-column p-1">
					<div>
						<p-button @click="addNewSegmentStart">Add Segments</p-button>
					</div>
				</div>
			</template>
			<template #no-items>
				<div class="flex flex-column align-items-center p-3">
					<h3>Segments</h3>
					<p-button @click="addNewSegmentEnd">Add Segments</p-button>
				</div>
			</template>
		</document-data-collection>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import StreamPlanSegmentEdit from "./StreamPlanSegmentEdit.vue"
import ScrollingTabBody from "../docking/ScrollingTabBody.vue"
import DocumentDataCollection from "../drag/DocumentDataCollection.vue"
import { StreamPlanConfig } from "castmate-schema"
import { StreamPlanSegmentView, StreamPlanView } from "./stream-plan-types"
import { useModel } from "vue"

import PButton from "primevue/button"
import { nanoid } from "nanoid/non-secure"
import { StreamPlanSegment } from "castmate-schema"

const props = defineProps<{
	modelValue: StreamPlanConfig
	view: StreamPlanView
}>()

const view = useModel(props, "view")
const model = useModel(props, "modelValue")

function createNewSegment(): [StreamPlanSegment, StreamPlanSegmentView] {
	const id = nanoid()

	return [
		{
			id,
			name: "",
			components: {
				"twitch-stream-info": {
					title: undefined,
					category: undefined,
				},
			},
			activationAutomation: { sequence: { actions: [] }, floatingSequences: [] },
			deactivationAutomation: { sequence: { actions: [] }, floatingSequences: [] },
		},
		{
			id,
		},
	]
}

function addNewSegmentEnd() {
	const [segment, viewdata] = createNewSegment()
	model.value.segments.push(segment)
	view.value.segments.push(viewdata)
}

function addNewSegmentStart() {
	const [segment, viewdata] = createNewSegment()
	model.value.segments.splice(0, 0, segment)
	view.value.segments.splice(0, 0, viewdata)
}
</script>
