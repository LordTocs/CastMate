<template>
	<div style="width: 60vw">
		<stream-plan-segment-edit v-model="config" v-if="config && view" v-model:view="view" :selected-ids="[]" />
		<div class="flex justify-content-end mt-1">
			<p-button label="Save" @click="submit"></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { createStreamPlanSegmentView, DocumentSelection, useDialogRef } from "../../main"
import { createInlineAutomation, StreamPlanSegment } from "castmate-schema"
import { StreamPlanSegmentView } from "./stream-plan-types"

import { computed, onMounted, provide, ref } from "vue"
import { nanoid } from "nanoid"

import PButton from "primevue/button"
import StreamPlanSegmentEdit from "./StreamPlanSegmentEdit.vue"

const dialogRef = useDialogRef()

const config = ref<StreamPlanSegment>()
const view = ref<StreamPlanSegmentView>()

const selectionData = ref<DocumentSelection>({
	items: [],
	container: "",
})

provide("documentSelection", selectionData)

onMounted(() => {
	if (!dialogRef.value?.data) {
		config.value = {
			id: nanoid(),
			name: "",
			components: {},
			activationAutomation: createInlineAutomation(),
			deactivationAutomation: createInlineAutomation(),
		}
	} else {
		config.value = dialogRef.value.data as StreamPlanSegment
	}
	view.value = createStreamPlanSegmentView(config.value)
})

function submit() {
	dialogRef.value?.close(config.value)
}

function cancel() {
	dialogRef.value?.close()
}
</script>

<style scoped></style>
