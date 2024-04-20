<template>
	<div
		ref="editArea"
		class="automation-edit"
		:style="{ '--time-scale': `${automationTimeScale}px`, backgroundColor: 'var(--surface-a)' }"
		tabindex="-1"
		@contextmenu="onContextMenu"
		@keydown="onKeyDown"
		@copy="onCopy"
		@cut="onCut"
		@paste="onPaste"
		@focus="onFocus"
		@blur="onBlur"
	>
		<select-dummy ref="dummy" />
		<pan-area class="panner grid-paper" v-model:panState="view.panState" :zoom-y="false">
			<sequence-edit
				v-model="model.sequence"
				:floating="false"
				ref="mainSequence"
				@request-test-run="onRunSequence"
				@request-test-stop="onStopSequence"
			/>
			<sequence-edit
				v-for="(s, i) in model.floatingSequences"
				:key="s.id"
				:model-value="model.floatingSequences[i]"
				:floating="true"
				ref="floatingSequences"
				@self-destruct="removeFloatingSequence(i)"
			/>
		</pan-area>
		<div
			ref="selectionRect"
			class="selection-rect"
			v-if="selecting"
			:style="{
				left: `${selectFrom?.x ?? 0}px`,
				top: `${selectFrom?.y ?? 0}px`,
				width: `${(selectTo?.x ?? 0) - (selectFrom?.x ?? 0)}px`,
				height: `${(selectTo?.y ?? 0) - (selectFrom?.y ?? 0)}px`,
			}"
		></div>
		<action-palette @select-action="onCreateAction" ref="palette" />
	</div>
</template>

<script setup lang="ts">
import { ref, toValue, useModel, provide } from "vue"
import { type Sequence, type AutomationData } from "castmate-schema"
import {
	ActionSelection,
	PanArea,
	AutomationView,
	getInternalMousePos,
	provideDocumentPath,
	usePluginStore,
	useDocumentSelection,
	TriggerSelection,
	useTrigger,
	useSelectionRect,
	useActiveTestSequence,
	useActionQueueStore,
	useDocumentPath,
	usePropagationStop,
	SelectionPos,
} from "../../main"
import SequenceEdit from "./SequenceEdit.vue"
import { provideAutomationEditState, copySequenceData } from "../../util/automation-dragdrop"
import ActionPalette from "./ActionPalette.vue"
import { FloatingSequence } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { automationTimeScale } from "./automation-shared"
import { constructDefault } from "castmate-schema"
import SelectDummy from "../util/SelectDummy.vue"
import { assignNewIds } from "castmate-schema"

const props = defineProps<{
	modelValue: AutomationData
	view: AutomationView
	//localPath?: string
	trigger?: TriggerSelection
}>()

const stopPropagation = usePropagationStop()

const editArea = ref<HTMLElement | null>(null)

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

//const path = provideDocumentPath(() => props.localPath)
const documentPath = useDocumentPath()
const selection = useDocumentSelection(documentPath)

provideAutomationEditState(editArea, (seq, offset, ev) => {
	if (!editArea.value) return

	const dropPos = getInternalMousePos(editArea.value, ev)

	const x = (dropPos.x - view.value.panState.panX - offset.x) / automationTimeScale / view.value.panState.zoomX
	const y = (dropPos.y - view.value.panState.panY - offset.y) / view.value.panState.zoomY

	const floatingSequence: FloatingSequence = {
		...seq,
		x,
		y,
		id: nanoid(),
	}

	model.value.floatingSequences.push(floatingSequence)
})

function removeFloatingSequence(index: number) {
	model.value.floatingSequences.splice(index, 1)
}

const mainSequence = ref<InstanceType<typeof SequenceEdit> | null>(null)
const floatingSequences = ref<InstanceType<typeof SequenceEdit>[]>([])

const testSequenceId = ref<string>("")
const actionQueueStore = useActionQueueStore()
const activeTestSequence = useActiveTestSequence(testSequenceId)
provide("activeTestSequence", activeTestSequence)

const trigger = useTrigger(() => props.trigger)

async function onRunSequence() {
	testSequenceId.value = await actionQueueStore.testSequence(props.modelValue.sequence, props.trigger)
}

async function onStopSequence() {
	actionQueueStore.stopTest(testSequenceId.value)
}

const lastSelectPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })

const {
	selecting,
	from: selectFrom,
	to: selectTo,
} = useSelectionRect(
	editArea,
	(from, to) => {
		const container = toValue(editArea)
		if (!container) return []

		const selectX = (to.x - view.value.panState.panX) / automationTimeScale / view.value.panState.zoomX
		const selectY = (to.y - view.value.panState.panY) / view.value.panState.zoomY

		lastSelectPos.value = {
			x: selectX,
			y: selectY,
		}

		const main = mainSequence.value?.getSelectedItems(container, from, to) ?? []
		const floats = floatingSequences.value.map((fs) => fs.getSelectedItems(container, from, to))
		const result: string[] = main

		for (const f of floats) {
			result.push(...f)
		}
		return result
	},
	documentPath
)

const palettePosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const palette = ref<typeof ActionPalette | null>(null)

const pluginStore = usePluginStore()

async function onCreateAction(actionSelection: ActionSelection) {
	if (!actionSelection.action || !actionSelection.plugin) return

	const x = (palettePosition.value.x - view.value.panState.panX) / automationTimeScale / view.value.panState.zoomX
	const y = (palettePosition.value.y - view.value.panState.panY) / view.value.panState.zoomY

	const actionInstance = await pluginStore.createAction(actionSelection)

	if (!actionInstance) return

	const floatingSequence: FloatingSequence = {
		actions: [actionInstance],
		x,
		y,
		id: nanoid(),
	}

	model.value.floatingSequences.push(floatingSequence)
}

function onContextMenu(ev: MouseEvent) {
	if (!editArea.value) return
	palettePosition.value = getInternalMousePos(editArea.value, ev)
	palette.value?.open(ev)
}

function deleteSelection() {
	if (selection.value.length > 0) {
		console.log("Deleting Ids", [...selection.value])
		mainSequence.value?.deleteIds(selection.value)
		for (const fs of floatingSequences.value) {
			fs.deleteIds(selection.value)
		}
	}
}

function onKeyDown(ev: KeyboardEvent) {
	if (ev.key == "Delete") {
		deleteSelection()

		ev.preventDefault()
		ev.stopPropagation()
	}
}

function copyToClipboard(ev: ClipboardEvent) {
	if (selection.value.length == 0) return

	const sequences: FloatingSequence[] = []

	const rootCopyData = copySequenceData(model.value.sequence, selection.value, { x: 0, y: 0 })

	if (rootCopyData) {
		sequences.push(...rootCopyData.subSeqs)
	}

	for (const seq of model.value.floatingSequences) {
		const copyData = copySequenceData(seq, selection.value, { x: seq.x, y: seq.y })

		if (!copyData) continue

		sequences.push(...copyData.subSeqs)
	}

	const minPos: SelectionPos = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY }

	for (const seq of sequences) {
		minPos.x = Math.min(seq.x)
		minPos.y = Math.min(seq.y)
	}

	for (const seq of sequences) {
		seq.x -= minPos.x
		seq.y -= minPos.y
	}

	const dataStr = JSON.stringify(sequences)

	ev.clipboardData?.setData("text/plain", dataStr)
	ev.clipboardData?.setData("automation/sequences", dataStr)
}

function onCopy(ev: ClipboardEvent) {
	copyToClipboard(ev)

	stopPropagation(ev)
	ev.preventDefault()
}

function onCut(ev: ClipboardEvent) {
	copyToClipboard(ev)
	deleteSelection()

	stopPropagation(ev)
	ev.preventDefault()
}

function onPaste(ev: ClipboardEvent) {
	const pasteStr = ev.clipboardData?.getData("automation/sequences")

	if (!pasteStr || pasteStr.length == 0) return

	try {
		const pasteData = JSON.parse(pasteStr)

		if (!Array.isArray(pasteData)) return

		for (const seq of pasteData as FloatingSequence[]) {
			seq.x += lastSelectPos.value.x
			seq.y += lastSelectPos.value.y
			assignNewIds(seq)
		}

		model.value.floatingSequences.push(...pasteData)

		stopPropagation(ev)
		ev.preventDefault()
	} catch {}
}

const dummy = ref<InstanceType<typeof SelectDummy>>()
function onFocus() {
	dummy.value?.select()
}

function onBlur() {}
</script>

<style scoped>
.automation-edit {
	--timeline-height: 100px;
	/* --time-scale: 40px; */
	--point-size: 15px;
	--instant-width: 100px;
	--time-handle-height: 15px;
	--time-handle-width: 45px;

	width: 100%;
	height: 100%;
	position: relative;
}

.panner {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	--time-width: calc(var(--zoom-x) * var(--time-scale));
}

.grid-paper {
	background: linear-gradient(-90deg, var(--surface-d) 1px, transparent 1px),
		linear-gradient(0deg, var(--surface-d) 1px, transparent 1px);
	background-size: calc(var(--zoom-x) * var(--time-scale)) var(--timeline-height),
		calc(var(--zoom-x) * var(--time-scale)) var(--timeline-height);
	background-position-x: var(--pan-x), 0;
	background-position-y: 0, var(--pan-y);
}

.panning {
	cursor: move;
}

.selection-rect {
	pointer-events: none;
	user-select: none;
	position: absolute;
	border-width: 2px;
	border-color: white;
	mix-blend-mode: difference;
	border-style: dashed;
}
</style>
