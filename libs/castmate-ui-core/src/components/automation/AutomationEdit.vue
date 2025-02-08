<template>
	<div class="automation-edit" @keydown="onKeyDown" @copy="onCopy" @cut="onCut" @paste="onPaste" ref="editDiv">
		<data-binding-path local-path="sequence">
			<automation-edit-area
				v-model="model"
				v-model:view="view.automationView"
				:trigger="model"
				class="flex-grow-1 w-0"
			/>
		</data-binding-path>
		<expander-slider
			v-if="showSelectionEdit"
			direction="vertical"
			:container="editDiv"
			v-model="splitterPos"
			:invert="true"
		/>
		<flex-scroller
			class="config"
			inner-class="px-2"
			v-if="showSelectionEdit"
			:style="{ width: `${splitterPos}px` }"
		>
			<action-config-edit v-if="selectedActionDef" v-model="selectedActionDef" :sequence="selectedSequence" />
			<trigger-config-edit v-else-if="selectedTriggerDef" v-model="selectedTriggerDef" />
		</flex-scroller>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, useModel } from "vue"
import {
	AutomationView,
	useDocumentSelection,
	FlexScroller,
	ExpanderSlider,
	DataBindingPath,
	useDataUIBinding,
} from "../../main"
import { AnyAction, ActionStack, AutomationData, isActionStack, findActionById } from "castmate-schema"
import AutomationEditArea from "./AutomationEditArea.vue"
import ActionConfigEdit from "./ActionConfigEdit.vue"
import TriggerConfigEdit from "./TriggerConfigEdit.vue"
import { findActionAndSequenceById } from "castmate-schema"
import PSplitter from "primevue/splitter"
import PSplitterPanel from "primevue/splitterpanel"
import { useElementSize } from "@vueuse/core"

const selection = useDocumentSelection("sequence")

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

const editDiv = ref<HTMLElement>()

const editDivSize = useElementSize(editDiv)

const splitterPos = ref(350)

const minConfigSize = computed(() => {
	if (!editDiv.value) return 25
	if (editDivSize.width.value < 650) return 50
	const size = (350 / editDivSize.width.value) * 100
	console.log(size)
	return size
})

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

function onCopy(ev: ClipboardEvent) {
	ev.stopPropagation()
}

function onCut(ev: ClipboardEvent) {
	ev.stopPropagation()
}

function onPaste(ev: ClipboardEvent) {
	ev.stopPropagation()
}

useDataUIBinding({
	onChildFocus(subPath) {
		console.log(subPath)
		if (subPath[0] == "sequence") {
		}
	},
	onChildScrollIntoView(subPath) {
		console.log(subPath)
	},
})
</script>

<style scoped>
.automation-edit {
	height: 100%;
	display: flex;
}

.config {
	background-color: var(--surface-b);
	user-select: none;
	overflow-y: auto;
	height: 100%;
}
</style>
