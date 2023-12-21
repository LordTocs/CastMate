<template>
	<div class="automation-edit-page">
		<automation-edit v-model="model" v-model:view="view.automationView" local-path="sequence" style="flex: 1" />
		<div class="config">
			<action-config-edit v-if="selectedAction" v-model="selectedAction" />
		</div>
	</div>
</template>

<script setup lang="ts">
import AutomationEdit from "./AutomationEdit.vue"
import ActionConfigEdit from "../profiles/ActionConfigEdit.vue"
import { AutomationConfig } from "castmate-schema"
import { AutomationResourceView, joinDocumentPath, useDocumentPath, useDocumentSelection } from "castmate-ui-core"
import { computed, useModel } from "vue"
import { AnyAction } from "castmate-schema"
import { ActionStack } from "castmate-schema"
import { isActionStack } from "castmate-schema"
import { getActionById } from "castmate-schema"

const props = defineProps<{
	modelValue: AutomationConfig
	view: AutomationResourceView
	selectedIds: string[]
}>()

const view = useModel(props, "view")
const model = useModel(props, "modelValue")

const documentPath = useDocumentPath()
const selection = useDocumentSelection(() => joinDocumentPath(documentPath.value, "sequence"))

function findActionById(id: string) {
	let action: AnyAction | ActionStack | undefined = undefined

	action = getActionById(id, model.value.sequence)
	if (action) {
		return action
	}

	for (const floatingSequence of model.value.floatingSequences) {
		action = getActionById(id, floatingSequence)
		if (action) {
			return action
		}
	}
}

const selectedAction = computed<AnyAction | undefined>(() => {
	if (selection.value.length > 1 || selection.value.length == 0) {
		return undefined
	}
	const id = selection.value[0]

	let action: AnyAction | ActionStack | undefined = undefined

	action = findActionById(id)

	if (!action) return undefined
	if (isActionStack(action)) return undefined

	return action
})
</script>

<style scoped>
.automation-edit-page {
	position: relative;
	--trigger-color: #3e3e3e;
	--darker-trigger-color: #2e2e2e;
	--darkest-trigger-color: #1e1e1e;
	--lighter-trigger-color: #4e4e4e;
}
.config {
	background-color: var(--surface-b);
	user-select: none;
	width: 350px;
	overflow-y: auto;
	overflow-x: visible;
}
</style>
