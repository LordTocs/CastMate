<template>
	<div class="flex flex-row">
		<document-path local-path="sequence">
			<automation-edit-area v-model="model" v-model:view="view.automationView" style="flex: 1" :trigger="model" />
		</document-path>
		<div class="config">
			<action-config-edit v-if="selectedActionDef" v-model="selectedActionDef" />
			<trigger-config-edit v-else-if="selectedTriggerDef" v-model="selectedTriggerDef" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, useModel } from "vue"
import { AutomationView, useDocumentPath, useDocumentSelection, DocumentPath, joinDocumentPath } from "../../main"
import { AnyAction, ActionStack, AutomationData, isActionStack, findActionById } from "castmate-schema"
import AutomationEditArea from "./AutomationEditArea.vue"
import ActionConfigEdit from "./ActionConfigEdit.vue"
import TriggerConfigEdit from "./TriggerConfigEdit.vue"

const path = useDocumentPath()
const selection = useDocumentSelection(() => joinDocumentPath(path.value, "sequence"))

interface AutomationPossiblyTrigger extends AutomationData {
	plugin?: string
	trigger?: string
	config?: any
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
</script>

<style scoped>
.config {
	background-color: var(--surface-b);
	user-select: none;
	width: 350px;
	overflow-y: auto;
	overflow-x: visible;
}
</style>
