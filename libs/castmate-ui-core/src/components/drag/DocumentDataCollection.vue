<template>
	<div class="drag-area" ref="dragArea">
		<slot name="header"></slot>
		<slot name="no-items" v-if="props.modelValue.length == 0"></slot>
		<div>
			<div
				class="draggable-item"
				v-for="(data, i) in props.modelValue"
				:key="data.id"
				ref="dataComponents"
				@mousedown="itemMouseDown(i, $event)"
				@dragstart="itemDragStart(i, $event)"
				@dragend="itemDragEnd(i, $event)"
				draggable="true"
			>
				<document-path :localPath="`[${data.id}]`">
					<component
						:is="dataComponent"
						v-model="modelObj[i]"
						v-model:view="view[i]"
						:selectedIds="selection"
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
import { getElementRelativeRect } from "../../util/dom"
import { provideDocumentPath } from "../../main"
import DocumentPath from "../document/DocumentPath.vue"

const props = withDefaults(
	defineProps<{
		modelValue: DocumentData[]
		view: any[]
		dataComponent: Component
		dataType?: string
		handleClass?: string
		localPath?: string
	}>(),
	{
		dataType: "document-data",
		handleClass: "drag-handle",
		view: () => [],
	}
)

const modelObj = useModel(props, "modelValue")
const view = useModel(props, "view")

const path = provideDocumentPath(() => props.localPath)

const selection = useDocumentSelection(path)

///DRAG HANDLERS

type VueHTMLElement = HTMLElement & {
	__vnode: VNode
}

const draggingItems = ref(false)
const dragArea = ref<HTMLElement | null>(null)
const dragHovering = ref(false)
const dataComponents = ref<VueHTMLElement[]>([])
const insertionIndex = ref<number>(0)

const orderedDataComponents = computed(() => {
	return modelObj.value.map((i) => dataComponents.value.find((c) => c.__vnode.key == i.id))
})

function overlaps(from: { x: number; y: number }, to: { x: number; y: number }, elem: DOMRect) {
	if (to.y < elem.top) return false
	if (from.y > elem.bottom) return false
	return true
}

const selectState = useSelectionRect(
	dragArea,
	(from, to) => {
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
				newSelection.push(modelObj.value[i].id)
			}
		}

		console.log("Select", newSelection)

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

		insertionIndex.value = getInsertionIndex(ev.clientY)
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

useDrop(
	dragArea,
	() => props.dataType,
	(ev: DragEventWithDataTransfer) => {
		dragHovering.value = false
		let insertionIdx = getInsertionIndex(ev.clientY)
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

		const newModel = [...modelObj.value]
		const newView = [...view.value]
		//console.log("DropEffect", evt.dataTransfer.dropEffect, evt.dataTransfer.effectAllowed)
		if (ev.dataTransfer.effectAllowed == "move" && draggingItems.value) {
			//We're moving internal items
			//Adjust the insertion index and remove the items from the model

			console.log("Internal move")

			for (const id of selection.value) {
				const idx = modelObj.value.findIndex((i) => i.id == id)

				if (idx < 0) {
					continue
				}

				if (idx < insertionIdx) {
					--insertionIdx
				}

				console.log("Removing", idx)
				newModel.splice(idx, 1)
				newView.splice(idx, 1)
			}
		}

		if (ev.dataTransfer.effectAllowed == "move" || ev.dataTransfer.effectAllowed == "copy") {
			console.log("Final inserting at", insertionIdx)
			newModel.splice(insertionIdx, 0, ...data)
			newView.splice(insertionIdx, 0, ...viewData)
		}

		modelObj.value = newModel
		view.value = newView

		console.log("NewModel", newModel)
		console.log("NewView", newView)
	}
)

function getInsertionIndex(clientY: number) {
	let result = 0

	for (let i = 0; i < orderedDataComponents.value.length; ++i) {
		const component = orderedDataComponents.value[i]

		if (!component) continue

		const boundingRect = component.getBoundingClientRect()

		const hy = (boundingRect.top + boundingRect.bottom) / 2

		if (clientY > hy) {
			result = i + 1
		}

		if (boundingRect.top > clientY) {
			break
		}
	}

	return result
}

function isChildOfClass(element: HTMLElement, clazz: string) {
	if (element.classList.contains(clazz)) return true

	let parent = element.parentElement
	while (parent) {
		if (parent.classList.contains(clazz)) return true
		parent = parent.parentElement
	}

	return false
}

function getSelectedData(copy: boolean) {
	const result = []

	for (const id of selection.value) {
		const item = modelObj.value.find((v) => v.id == id)

		if (item) {
			const itemDupe = _cloneDeep(item)
			if (copy) {
				itemDupe.id = nanoid()
			}
			result.push(itemDupe)
		}
	}

	return result
}

function getSelectedViewData(copy: boolean) {
	const result = []

	for (const id of selection.value) {
		const item = view.value.find((v) => v.id == id)

		if (item) {
			const itemDupe = _cloneDeep(item)
			if (copy) {
				itemDupe.id = nanoid()
			}
			result.push(itemDupe)
		}
	}

	return result
}

/// DRAG ITEM HANDLERS

//In order to check if the handle class is respected we need to save off the mousedown event's target, since dragevent originates from the draggable div
let dragTarget: HTMLElement | null = null
function itemMouseDown(i: number, evt: MouseEvent) {
	console.log("Drag Handling Mouse Down")
	dragTarget = evt.target as HTMLElement
	if (isChildOfClass(dragTarget, props.handleClass)) {
		evt.stopPropagation()
	}
}

function itemDragStart(i: number, evt: DragEvent) {
	console.log("Drag Start", evt.target, evt)

	if (!evt.target) return
	if (!evt.dataTransfer) return

	if (dragTarget && isChildOfClass(dragTarget, props.handleClass)) {
		selectState.cancelSelection()

		draggingItems.value = true

		if (!selection.value.includes(modelObj.value[i].id)) {
			selection.value = [modelObj.value[i].id]
		}

		evt.dataTransfer.effectAllowed = evt.altKey ? "copy" : "move"
		evt.dataTransfer.setData(props.dataType, JSON.stringify(getSelectedData(evt.altKey)))
		evt.dataTransfer.setData(`${props.dataType}-view`, JSON.stringify(getSelectedViewData(evt.altKey)))
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
		if (!draggingItems.value) {
			console.log("Remote Drop")
			//These items are dropped into another frame, remove them from our model
			modelObj.value = modelObj.value.filter((i) => !selection.value.includes(i.id))
			view.value = view.value.filter((i) => !selection.value.includes(i.id))
		}
	} else if (evt.dataTransfer.dropEffect == "copy") {
		//Copied somewhere
	}

	draggingItems.value = false
}
</script>

<style scoped>
.drag-area {
	padding-top: 1rem;
	padding-bottom: 1rem;
}

.draggable-item:not(:last-of-type) {
	margin-bottom: 0.5rem;
}
</style>
