<template>
	<v-dialog v-model="dialog">
		<v-card>
			<v-toolbar dark dense flat>
				<v-toolbar-title
					class="text-body-2 font-weight-bold grey--text"
				>
					Edit Segment
				</v-toolbar-title>
			</v-toolbar>
			<v-card-text>
				<segment-editor v-model="segmentData" />
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn color="grey" @click="cancel"> Cancel </v-btn>
				<v-btn color="primary" @click="ok"> OK </v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { ref } from "vue"
import { useResourceFunctions } from "../../utils/resources"
import SegmentEditor from "./SegmentEditor.vue"
import _cloneDeep from "lodash/cloneDeep"

const streamplanResource = useResourceFunctions("streamplan")

const props = defineProps({
	planId: { type: String },
	segmentId: { type: String },
})

const dialog = ref(false)

const segmentData = ref(null)

async function open() {
	const plan = await streamplanResource.getById(props.planId)

	if (!plan) {
		return
	}

	segmentData.value = _cloneDeep(
		plan.config.segments.find((s) => s.id == props.segmentId)
	)

	if (!segmentData.value) return

	dialog.value = true
}

async function cancel() {
	segmentData.value = null
	dialog.value = false
}

async function ok() {
	const plan = await streamplanResource.getById(props.planId)
	if (!plan) {
		return
	}

	const newConfig = _cloneDeep(plan.config)

	const segmentIdx = newConfig.segments.findIndex(
		(s) => s.id == props.segmentId
	)

	if (segmentIdx == -1) {
		return
	}

	newConfig.segments[segmentIdx] = _cloneDeep(segmentData.value)

	console.log(newConfig)
	await streamplanResource.setConfig(props.planId, newConfig)

	dialog.value = false
}

defineExpose({ open })
</script>
