<template>
	<div
		ref="editArea"
		class="overlay-edit"
		:style="{
			'--overlay-width': `${modelValue.size.width}px`,
			'--overlay-height': `${modelValue.size.height}px`,
			'--zoom-scale': zoomScale,
		}"
		tabindex="-1"
		@copy="onCopy"
		@cut="onCut"
		@paste="onPaste"
		@focus="onFocus"
		@blur="onBlur"
		@keydown="onKeyDown"
	>
		<select-dummy ref="dummy" />
		<pan-area class="panner grid-paper" v-model:pan-state="view.editView.panState">
			<overlay-preview :preview="model.preview" :view="view" />
			<div class="overlay-boundary"></div>
			<overlay-widget-edit
				v-for="(widget, i) in model.widgets"
				v-model="model.widgets[i]"
				:key="widget.id"
				ref="widgets"
				@delete="deleteWidget(i)"
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
	</div>
</template>

<script setup lang="ts">
import {
	PanArea,
	getElementRelativeRect,
	rectangleOverlaps,
	useDocumentPath,
	useDocumentSelection,
	usePanState,
	usePropagationStop,
	useSelectionRect,
	SelectDummy,
} from "castmate-ui-core"
import { OverlayConfig, OverlayWidgetConfig } from "castmate-plugin-overlays-shared"
import { OverlayEditorView } from "./overlay-edit-types"
import { computed, provide, ref, useModel } from "vue"
import { useElementSize } from "@vueuse/core"
import OverlayWidgetEdit from "./OverlayWidgetEdit.vue"
import OverlayPreview from "./OverlayPreview.vue"
import { nanoid } from "nanoid/non-secure"
import _cloneDeep from "lodash/cloneDeep"

const props = defineProps<{
	modelValue: OverlayConfig
	view: OverlayEditorView
}>()

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const editArea = ref<HTMLElement>()

const editSize = useElementSize(editArea)

const widgets = ref<InstanceType<typeof OverlayWidgetEdit>[]>([])

const zoomScale = computed(() => {
	const horizontalScale = editSize.width.value / model.value.size.width
	const verticalScale = editSize.height.value / model.value.size.height
	return Math.min(horizontalScale, verticalScale)
})

function deleteWidget(idx: number) {
	model.value.widgets.splice(idx, 1)
}

const lastSelectPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })

const path = useDocumentPath()
const selection = useDocumentSelection(path)
const {
	selecting,
	from: selectFrom,
	to: selectTo,
} = useSelectionRect(
	editArea,
	(from, to) => {
		const areaElem = editArea.value
		if (!areaElem) return []

		const selectX =
			(to.x - view.value.editView.panState.panX) / zoomScale.value / view.value.editView.panState.zoomX
		const selectY =
			(to.y - view.value.editView.panState.panY) / zoomScale.value / view.value.editView.panState.zoomY

		lastSelectPos.value = {
			x: selectX,
			y: selectY,
		}

		const newSelect: string[] = []

		for (let i = 0; i < widgets.value.length; ++i) {
			const widget = widgets.value[i]
			if (!widget.frame) {
				console.error("NO FRAME ON WIDGET", i)
				continue
			}

			if (props.modelValue.widgets[i].locked) continue

			const localRect = getElementRelativeRect(widget.frame, areaElem)
			const selrect = new DOMRect(from.x, from.y, to.x - from.x, to.y - from.y)
			if (rectangleOverlaps(selrect, localRect)) {
				const id = props.modelValue.widgets[i].id
				newSelect.push(id)
			}
		}

		return newSelect
	},
	path
)

provide("overlay-zoom-scale", zoomScale)

const stopPropagation = usePropagationStop()

function deleteSelection() {
	for (const id of selection.value) {
		const idx = model.value.widgets.findIndex((w) => w.id == id)

		if (idx < 0) continue

		model.value.widgets.splice(idx, 1)
	}
}

function onKeyDown(ev: KeyboardEvent) {
	if (ev.key == "Delete") {
		deleteSelection()

		ev.preventDefault()
		ev.stopPropagation()
	}
}

function copySelection(ev: ClipboardEvent) {
	const copyData: OverlayWidgetConfig[] = []

	for (const id of selection.value) {
		const widget = model.value.widgets.find((w) => w.id == id)

		if (!widget) continue

		const clone: OverlayWidgetConfig = _cloneDeep(widget)
		clone.locked = false
		clone.visible = true

		copyData.push(clone)
	}

	if (copyData.length == 0) return

	const minPos = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY }

	for (const widget of copyData) {
		minPos.x = Math.min(minPos.x, widget.position.x)
		minPos.y = Math.min(minPos.y, widget.position.y)
	}

	for (const widget of copyData) {
		widget.position.x -= minPos.x
		widget.position.y -= minPos.y
	}

	const dataStr = JSON.stringify(copyData)

	ev.clipboardData?.setData("text/plain", dataStr)
	ev.clipboardData?.setData("overlay/widgets", dataStr)
}

function onCopy(ev: ClipboardEvent) {
	copySelection(ev)
	stopPropagation(ev)
	ev.preventDefault()
}

function onCut(ev: ClipboardEvent) {
	copySelection(ev)
	deleteSelection()
	stopPropagation(ev)
	ev.preventDefault()
}

function onPaste(ev: ClipboardEvent) {
	const pasteStr = ev.clipboardData?.getData("overlay/widgets")

	if (!pasteStr || pasteStr.length == 0) return

	try {
		const pasteData = JSON.parse(pasteStr)

		if (!Array.isArray(pasteData)) return

		for (const widget of pasteData as OverlayWidgetConfig[]) {
			widget.id = nanoid()
			widget.position.x += lastSelectPos.value.x
			widget.position.y += lastSelectPos.value.y

			let name = widget.name

			if (model.value.widgets.find((w) => w.name == name)) {
				let number = 1

				while (model.value.widgets.find((w) => w.name == name)) {
					name = `${widget.name} ${number}`
					number++
				}
			}

			widget.name = name
		}

		model.value.widgets.push(...pasteData)

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
.overlay-edit {
	position: relative;
	width: 100%;
	height: 100%;
}
.grid-paper {
	background: linear-gradient(-90deg, var(--surface-d) 1px, transparent 1px),
		linear-gradient(0deg, var(--surface-d) 1px, transparent 1px);
	background-size: calc(var(--zoom-x) * var(--zoom-scale) * var(--overlay-width) / 10)
			calc(var(--zoom-y) * var(--zoom-scale) * var(--overlay-height) / 10),
		calc(var(--zoom-x) * var(--zoom-scale) * var(--overlay-width) / 10)
			calc(var(--zoom-y) * var(--zoom-scale) * var(--overlay-height) / 10);
	background-position-x: var(--pan-x), 0;
	background-position-y: 0, var(--pan-y);
}

.overlay-boundary {
	position: relative;
	border: 1px solid yellow;
	width: calc(var(--overlay-width) * var(--zoom-x) * var(--zoom-scale));
	height: calc(var(--overlay-height) * var(--zoom-y) * var(--zoom-scale));
}

.panner {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
}

.preview-image {
	position: absolute;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
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

.preview {
	position: absolute;
	top: var(--preview-offset-y);
	left: var(--preview-offset-x);
}
</style>
