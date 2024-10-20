<template>
	<div
		class="drag-area"
		ref="dragArea"
		tabindex="-1"
		@mousedown="onClick"
		@keydown="onKeyDown"
		@focus="onFocus"
		@onBlur="onBlur"
		@copy="onCopy"
		@cut="onCut"
		@paste="onPaste"
		:style="{
			'--column-count': columnCount,
			'--row-height': `${rowHeight}px`,
		}"
	>
		<select-dummy ref="selectDummy" />
		<slot name="header"></slot>
		<slot name="no-items" v-if="props.modelValue.length == 0"></slot>
		<div class="grid-div">
			<div
				class="draggable-item"
				v-for="(data, i) in props.modelValue"
				:key="data.id"
				:ref="(el) => setDataCompRef(i, el as HTMLElement)"
				:style="{ '--column-size': getByPath(data, widthProp), '--row-size': getByPath(data, heightProp) }"
				@mousedown="itemMouseDown(i, $event)"
				@dragstart="itemDragStart(i, $event)"
				@dragend="itemDragEnd(i, $event)"
				draggable="true"
			>
				<document-path :localPath="`[${data.id}]`">
					<component
						:is="dataComponent"
						v-model="model[i]"
						v-model:view="view[i]"
						:selectedIds="selection"
						@delete="deleteItem(i)"
					></component>
				</document-path>
			</div>
		</div>
		<slot name="footer"></slot>
	</div>
</template>

<script setup lang="ts">
import { type Component, ref, type VNode, computed, useModel } from "vue"
import { type DocumentData, useDocumentSelection } from "../../util/document"
import _cloneDeep from "lodash/cloneDeep"
import { nanoid } from "nanoid/non-secure"
import { DragEventWithDataTransfer, useDragEnter, useDragLeave, useDragOver, useDrop } from "../../util/dragging"
import { useSelectionRect } from "../../util/selection"
import { getElementRelativeRect, isChildOfClass, usePropagationImmediateStop, usePropagationStop } from "../../util/dom"
import { provideDocumentPath } from "../../main"
import DocumentPath from "../document/DocumentPath.vue"
import SelectDummy from "../util/SelectDummy.vue"

import { useOrderedRefs } from "./OrderedTemplateRefs"
import { getByPath } from "castmate-schema"

const props = withDefaults(
	defineProps<{
		modelValue: DocumentData[]
		view: any[]
		columnCount: number
		rowHeight: number
		dataComponent: Component
		dataType?: string
		handleClass?: string
		localPath?: string
		widthProp?: string
		heightProp?: string
	}>(),
	{
		dataType: "document-data",
		handleClass: "drag-handle",
		columnCount: 4,
		rowHeight: 56,
		widthProp: "size.width",
		heightProp: "size.height",
		view: () => [],
	}
)

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const path = provideDocumentPath(() => props.localPath)

const selection = useDocumentSelection(path)

///DRAG HANDLERS

const draggingItems = ref(false)
const dragArea = ref<HTMLElement | null>(null)
const dragHovering = ref(false)
const insertionIndex = ref<number>(0)

const { orderedElements: orderedDataComponents, setRef: setDataCompRef } = useOrderedRefs<HTMLElement>(
	() => props.modelValue
)

function overlaps(from: { x: number; y: number }, to: { x: number; y: number }, elem: DOMRect) {
	if (to.y < elem.top) return false
	if (from.y > elem.bottom) return false
	if (to.x < elem.left) return false
	if (from.x > elem.right) return false
	return true
}

function contains(point: { x: number; y: number }, elem: DOMRect) {
	if (point.y < elem.top) return false
	if (point.y > elem.bottom) return false
	if (point.x < elem.left) return false
	if (point.x > elem.right) return false
	return true
}

function distance(point: { x: number; y: number }, elem: DOMRect) {
	let offsetX = 0
	let offsetY = 0

	if (point.y < elem.top) {
		offsetY = elem.top - point.y
	} else if (point.y > elem.bottom) {
		offsetY = point.y - elem.bottom
	}

	if (point.x < elem.left) {
		offsetX = elem.left - point.x
	} else if (point.x > elem.right) {
		offsetX = point.x - elem.right
	}

	return Math.sqrt(offsetX * offsetX + offsetY * offsetY)
}

const selectState = useSelectionRect(
	dragArea,
	(from, to) => {
		//console.log("Select", from, to)
		const dragAreaElem = dragArea.value
		if (!dragAreaElem) {
			return []
		}

		const newSelection = []

		for (let i = 0; i < orderedDataComponents.value.length; ++i) {
			const comp = orderedDataComponents.value[i]
			if (!comp) continue

			const localRect = getElementRelativeRect(comp, dragAreaElem)
			if (overlaps(from, to, localRect)) {
				newSelection.push(model.value[i].id)
			}
		}

		//console.log("Select", newSelection)

		return newSelection
	},
	path
)

useDragOver(
	dragArea,
	() => props.dataType,
	(ev: DragEventWithDataTransfer) => {
		if (ev.dataTransfer.effectAllowed == "move") ev.dataTransfer.dropEffect = "move"
		if (ev.dataTransfer.effectAllowed == "copy") ev.dataTransfer.dropEffect = "copy"

		insertionIndex.value = getInsertionIndex(ev.clientX, ev.clientY)
	}
)

useDragEnter(
	dragArea,
	() => props.dataType,
	(ev: DragEventWithDataTransfer) => {
		dragHovering.value = true
	}
)

useDragLeave(
	dragArea,
	() => props.dataType,
	(ev: DragEventWithDataTransfer) => {
		dragHovering.value = false
	}
)

const droppedLocal = ref<boolean>(false)

useDrop(
	dragArea,
	() => props.dataType,
	(ev: DragEventWithDataTransfer) => {
		dragHovering.value = false
		let insertionIdx = getInsertionIndex(ev.clientX, ev.clientY)
		console.log("Inserting at", insertionIdx)

		const dataStr = ev.dataTransfer.getData(props.dataType)
		const viewStr = ev.dataTransfer.getData(`${props.dataType}-view`)

		let data: DocumentData[] = []
		let viewData: any[] = []

		try {
			data = JSON.parse(dataStr)
			viewData = JSON.parse(viewStr)
		} catch (err) {
			console.error("HOW DID WE GET HERE?")
			return
		}

		const newModel = [...model.value]
		const newView = [...view.value]
		//console.log("DropEffect", evt.dataTransfer.dropEffect, evt.dataTransfer.effectAllowed)
		if (ev.dataTransfer.effectAllowed == "move" && draggingItems.value) {
			//We're moving internal items
			//Adjust the insertion index and remove the items from the model

			//console.log("Internal move")
			droppedLocal.value = true

			for (const id of selection.value) {
				const idx = newModel.findIndex((i) => i.id == id)

				if (idx < 0) {
					continue
				}

				if (idx < insertionIdx) {
					--insertionIdx
				}

				//console.log("Removing", id, idx)
				newModel.splice(idx, 1)
				newView.splice(idx, 1)
			}
		}

		if (ev.dataTransfer.effectAllowed == "move" || ev.dataTransfer.effectAllowed == "copy") {
			//console.log("Final inserting at", insertionIdx)
			newModel.splice(insertionIdx, 0, ...data)
			newView.splice(insertionIdx, 0, ...viewData)
		}

		model.value = newModel
		view.value = newView

		console.log("NewModel", newModel)
		console.log("NewView", newView)
	}
)

function getInsertionIndex(clientX: number, clientY: number) {
	const point = { x: clientX, y: clientY }

	let closestInside = false
	let closestDistance = Number.POSITIVE_INFINITY
	let closest: HTMLElement | undefined = undefined
	let closestIdx = 0
	let closestBounds: DOMRect | undefined = undefined

	for (let i = 0; i < orderedDataComponents.value.length; ++i) {
		const component = orderedDataComponents.value[i]

		if (!component) continue

		const boundingRect = component.getBoundingClientRect()

		if (contains(point, boundingRect)) {
			closest = component
			closestIdx = i
			closestInside = true
			closestBounds = boundingRect
			break
		}

		const dist = distance(point, boundingRect)

		if (dist < closestDistance) {
			closestDistance = dist
			closest = component
			closestIdx = i
			closestBounds = boundingRect
		}
	}

	if (!closestBounds) return 0

	const centerPoint = {
		x: (closestBounds.right + closestBounds.left) / 2,
		y: (closestBounds.top + closestBounds.bottom) / 2,
	}
	const diff = { x: point.x - centerPoint.x, y: point.y - centerPoint.y }
	const diffNorm = { x: diff.x / closestBounds.width, y: diff.y / closestBounds.height }

	let indexOffset = 0

	if (Math.abs(diffNorm.x) > Math.abs(diffNorm.y)) {
		//Side
		if (diff.x > 0) indexOffset = 1
	} else {
		//Above / Below
		if (diff.y > 0) indexOffset = 1
	}

	return closestIdx + indexOffset
}

function getSelectedData(copy: boolean) {
	const resultItems = []
	const resultView = []

	for (const id of selection.value) {
		const item = model.value.find((v) => v.id == id)
		const viewItem = view.value.find((v) => v.id == id)

		if (!item || !viewItem) continue

		const itemDupe = _cloneDeep(item)
		const viewDupe = _cloneDeep(viewItem)
		if (copy) {
			itemDupe.id = nanoid()
			viewDupe.id = itemDupe.id
		}
		resultItems.push(itemDupe)
		resultView.push(viewDupe)
	}

	return { modelItems: resultItems, viewItems: resultView }
}

const stopPropagation = usePropagationStop()
const stopImmediatePropagation = usePropagationImmediateStop()

/// DRAG ITEM HANDLERS

//In order to check if the handle class is respected we need to save off the mousedown event's target, since dragevent originates from the draggable div
let dragTarget: HTMLElement | null = null
function itemMouseDown(i: number, evt: MouseEvent) {
	//console.log("Drag Handling Mouse Down", i)
	dragTarget = evt.target as HTMLElement
	if (isChildOfClass(dragTarget, props.handleClass)) {
		//console.log("IMMEDIATE STOP")
		stopImmediatePropagation(evt)
		selectState.externalClickSelect(evt)
	}
}

function itemDragStart(i: number, evt: DragEvent) {
	if (!evt.target) return
	if (!evt.dataTransfer) return

	if (dragTarget && isChildOfClass(dragTarget, props.handleClass)) {
		console.log("Drag Start", evt.target, evt)
		selectState.cancelSelection()

		draggingItems.value = true

		if (!selection.value.includes(model.value[i].id)) {
			selection.value = [model.value[i].id]
		}

		evt.dataTransfer.effectAllowed = evt.altKey ? "copy" : "move"

		const { modelItems, viewItems } = getSelectedData(evt.altKey)
		evt.dataTransfer.setData(props.dataType, JSON.stringify(modelItems))
		evt.dataTransfer.setData(`${props.dataType}-view`, JSON.stringify(viewItems))

		evt.stopPropagation()
	} else {
		evt.preventDefault()
	}
}

function itemDragEnd(i: number, evt: DragEvent) {
	if (!evt.dataTransfer) return
	dragTarget = null

	//console.log("DragEnd", evt.dataTransfer.dropEffect, evt.dataTransfer.effectAllowed)

	if (evt.dataTransfer.dropEffect == "none") {
		//No drop
	} else if (evt.dataTransfer.dropEffect == "move") {
		//Dropped somewhere
		if (!droppedLocal.value) {
			console.log("Remote Drop")
			//These items are dropped into another frame, remove them from our model
			model.value = model.value.filter((i) => !selection.value.includes(i.id))
			view.value = view.value.filter((i) => !selection.value.includes(i.id))
		}
	} else if (evt.dataTransfer.dropEffect == "copy") {
		//Copied somewhere
	}

	draggingItems.value = false
	droppedLocal.value = false
}

function deleteItem(index: number) {
	model.value.splice(index, 1)
	view.value.splice(index, 1)
}

/////////////////////////////////////////////
//////// KEYBOARD SHORTCUTS /////////////////
///////////////////////////////////////////////

function deleteSelected() {
	model.value = model.value.filter((i) => !selection.value.includes(i.id))
	view.value = view.value.filter((i) => !selection.value.includes(i.id))
	selection.value = []
}

function onKeyDown(ev: KeyboardEvent) {
	if (ev.key == "Delete") {
		if (selection.value.length > 0) {
			ev.preventDefault()
			ev.stopPropagation()
			deleteSelected()
		}
	}
}

/////////////////////////////////////////////
//////// FOCUS EVENTS /////////////////
///////////////////////////////////////////////

const selectDummy = ref<InstanceType<typeof SelectDummy>>()
function onFocus() {
	selectDummy.value?.select()
}

function onBlur() {}

function onClick(ev: MouseEvent) {
	if (ev.button == 0) {
		//console.log("CLICK!")
		selectDummy.value?.select()
		dragArea.value?.focus({ preventScroll: true })
		// stopImmediatePropagation(ev)
		// ev.preventDefault()
	}
}

//////////////////////////////////////////////
//////// COPY PASTE //////////////////////////
//////////////////////////////////////////////

function onCopy(ev: ClipboardEvent) {
	console.log("Copy!")

	if (selection.value.length == 0) return

	const { modelItems, viewItems } = getSelectedData(true)

	const modelStr = JSON.stringify(modelItems)
	const viewStr = JSON.stringify(viewItems)

	ev.clipboardData?.setData("text/plain", modelStr)
	ev.clipboardData?.setData(props.dataType, modelStr)
	ev.clipboardData?.setData(`${props.dataType}-view`, viewStr)
	ev.preventDefault()
}

function onCut(ev: ClipboardEvent) {
	console.log("Cut!")
	onCopy(ev)
	deleteSelected()
}

function onPaste(ev: ClipboardEvent) {
	console.log("Paste!")

	const pasteStr = ev.clipboardData?.getData(props.dataType)
	const viewStr = ev.clipboardData?.getData(`${props.dataType}-view`)
	if (!pasteStr || pasteStr.length == 0 || !viewStr || viewStr.length == 0) return

	try {
		const pasteData = JSON.parse(pasteStr)
		const viewData = JSON.parse(viewStr)

		if (!Array.isArray(pasteData)) return

		model.value.splice(model.value.length, 0, ...pasteData)
		view.value.splice(view.value.length, 0, ...viewData)
	} catch {}
}
</script>

<style scoped>
.drag-area {
	display: flex;
	flex-direction: column;
}

.grid-div {
	flex: 1;

	display: grid;
	--row-height: 56px;
	--grid-gap: 0.25rem;
	padding: 0.25rem;
	gap: var(--grid-gap);
	grid-template-columns: repeat(var(--column-count), 1fr);
	grid-template-rows: repeat(auto-fill, var(--row-height));
}

.draggable-item {
	position: relative;

	height: calc(var(--row-size) * var(--row-height) + max(0, var(--row-size) - 1) * var(--grid-gap));

	grid-row: span var(--row-size);
	grid-column: span var(--column-size);
}
</style>
