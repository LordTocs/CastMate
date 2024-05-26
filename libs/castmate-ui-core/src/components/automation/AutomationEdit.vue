<template>
	<div class="flex flex-row" @keydown="onKeyDown">
		<document-path local-path="sequence">
			<automation-edit-area v-model="model" v-model:view="view.automationView" style="flex: 1" :trigger="model" />
		</document-path>
		<flex-scroller class="config" v-if="showSelectionEdit">
			<action-config-edit v-if="selectedActionDef" v-model="selectedActionDef" :sequence="selectedSequence" />
			<trigger-config-edit v-else-if="selectedTriggerDef" v-model="selectedTriggerDef" />
		</flex-scroller>
	</div>
</template>

<script setup lang="ts">
import { computed, useModel } from "vue"
import {
	AutomationView,
	useDocumentPath,
	useDocumentSelection,
	DocumentPath,
	joinDocumentPath,
	FlexScroller,
} from "../../main"
import { AnyAction, ActionStack, AutomationData, isActionStack, findActionById } from "castmate-schema"
import AutomationEditArea from "./AutomationEditArea.vue"
import ActionConfigEdit from "./ActionConfigEdit.vue"
import TriggerConfigEdit from "./TriggerConfigEdit.vue"
import { findActionAndSequenceById } from "castmate-schema"

const path = useDocumentPath()
const selection = useDocumentSelection(() => joinDocumentPath(path.value, "sequence"))

interface AutomationPossiblyTrigger extends AutomationData {
	plugin?: string
	trigger?: string
	config?: any
	stop?: boolean
}

interface AutomationPossiblyTriggerView {
	automationView: AutomationView
}

const props = defineProps<{
	modelValue: AutomationPossiblyTrigger
	view: AutomationPossiblyTriggerView
}>()

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const showSelectionEdit = computed(() => {
	if (selection.value.length > 1 || selection.value.length == 0) {
		return false
	}
	return true
})

const selectedSequence = computed(() => {
	if (selection.value.length > 1 || selection.value.length == 0) {
		return undefined
	}
	const id = selection.value[0]

	const actionSeq = findActionAndSequenceById(id, props.modelValue)

	if (actionSeq == null) return undefined
	if (isActionStack(actionSeq.action)) return undefined

	return actionSeq.sequence
})

const selectedActionDef = computed<AnyAction | undefined>(() => {
	if (selection.value.length > 1 || selection.value.length == 0) {
		return undefined
	}
	const id = selection.value[0]

	let action: AnyAction | ActionStack | undefined = undefined

	action = findActionById(id, props.modelValue)

	if (!action) return undefined
	if (isActionStack(action)) return undefined

	return action
})

const selectedTriggerDef = computed(() => {
	if (selection.value.length > 1 || selection.value.length == 0) {
		return undefined
	}
	const id = selection.value[0]

	if (id != "trigger") return undefined

	return props.modelValue
})

function onKeyDown(ev: KeyboardEvent) {
	//Prevent bubbling Delete up any further otherwise it will try to delete the collection selection.
	if (ev.key == "Delete") {
		ev.stopPropagation()
	}
}
</script>

<style scoped>
.config {
	background-color: var(--surface-b);
	user-select: none;
	width: 350px;
	overflow-y: auto;
}
</style>
