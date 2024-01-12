<template>
	<div
		ref="editArea"
		class="automation-edit"
		:style="{ '--time-scale': `${automationTimeScale}px` }"
		tabindex="-1"
		@contextmenu="onContextMenu"
		@keydown="onKeyDown"
	>
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
} from "../../main"
import SequenceEdit from "./SequenceEdit.vue"
import { provideAutomationEditState } from "../../util/automation-dragdrop"
import ActionPalette from "./ActionPalette.vue"
import { FloatingSequence } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { automationTimeScale } from "./automation-shared"
import { constructDefault } from "castmate-schema"

const props = defineProps<{
	modelValue: AutomationData
	view: AutomationView
	localPath?: string
	trigger?: TriggerSelection
}>()

const editArea = ref<HTMLElement | null>(null)

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const path = provideDocumentPath(() => props.localPath)
const selection = useDocumentSelection(path)

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

const {
	selecting,
	from: selectFrom,
	to: selectTo,
} = useSelectionRect(
	editArea,
	(from, to) => {
		const container = toValue(editArea)
		if (!container) return []

		const main = mainSequence.value?.getSelectedItems(container, from, to) ?? []
		const floats = floatingSequences.value.map((fs) => fs.getSelectedItems(container, from, to))
		const result: string[] = main

		for (const f of floats) {
			result.push(...f)
		}
		return result
	},
	path
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

function onKeyDown(ev: KeyboardEvent) {
	if (ev.key == "Delete") {
		if (selection.value.length > 0) {
			console.log("Deleting Ids", [...selection.value])
			mainSequence.value?.deleteIds(selection.value)
			for (const fs of floatingSequences.value) {
				fs.deleteIds(selection.value)
			}
		}

		ev.preventDefault()
		ev.stopPropagation()
	}
}
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
