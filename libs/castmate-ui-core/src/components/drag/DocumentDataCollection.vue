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
				<component
					:is="dataComponent"
					v-model="modelObj[i]"
					v-model:view="view[i]"
					:selected="selection"
				></component>
			</div>
		</div>
		<slot name="footer"></slot>
	</div>
</template>

<script setup lang="ts">
import { type Component, ref, type VNode, computed, useModel } from "vue"
import { useVModel } from "@vueuse/core"
import { type DocumentData, type DocumentDataSelection } from "../../util/document"
import _cloneDeep from "lodash/cloneDeep"
import { nanoid } from "nanoid/non-secure"
import { DragEventWithDataTransfer, useDragEnter, useDragLeave, useDragOver, useDrop } from "../../util/dragging"

const props = withDefaults(
	defineProps<{
		modelValue: DocumentData[]
		view: any[]
		dataComponent: Component
		dataType?: string
		handleClass?: string
	}>(),
	{
		dataType: "document-data",
		handleClass: "drag-handle",
		view: () => [],
	}
)

const selection = ref<DocumentDataSelection>({
	selectedIds: [],
})

const modelObj = useModel(props, "modelValue")
const view = useModel(props, "view")

///DRAG HANDLERS

type VueHTMLElement = HTMLElement & {
	__vnode: VNode
}

const draggingItems = ref(false)
const dragArea = ref<HTMLElement | null>(null)
const dragHovering = ref(false)
const dataComponents = ref<VueHTMLElement[]>([])
const insertionIndex = ref<number>(0)

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

		//console.log("DropEffect", evt.dataTransfer.dropEffect, evt.dataTransfer.effectAllowed)
		if (ev.dataTransfer.effectAllowed == "move" && draggingItems.value) {
			//We're moving internal items
			//Adjust the insertion index and remove the items from the model

			console.log("internal move")

			for (const id of selection.value.selectedIds) {
				const idx = modelObj.value.findIndex((i) => i.id == id)

				if (idx < 0) {
					continue
				}

				if (idx < insertionIdx) {
					--insertionIdx
				}

				modelObj.value.splice(idx, 1)
			}
		}

		if (ev.dataTransfer.effectAllowed == "move" || ev.dataTransfer.effectAllowed == "copy") {
			console.log("Final inserting at", insertionIdx)
			modelObj.value.splice(insertionIdx, 0, ...data)
			view.value.splice(insertionIdx, 0, ...viewData)
		}
	}
)

const orderedDataComponents = computed(() => {
	return modelObj.value.map((i) => dataComponents.value.find((c) => c.__vnode.key == i.id))
})

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

	for (const id of selection.value.selectedIds) {
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

	for (const id of selection.value.selectedIds) {
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
	dragTarget = evt.target as HTMLElement
}

function itemDragStart(i: number, evt: DragEvent) {
	//console.log("Drag Start", evt.target, evt)

	if (!evt.target) return
	if (!evt.dataTransfer) return

	if (dragTarget && isChildOfClass(dragTarget, props.handleClass)) {
		draggingItems.value = true

		if (!selection.value.selectedIds.includes(modelObj.value[i].id)) {
			selection.value.selectedIds = [modelObj.value[i].id]
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
		if (!dragHovering.value) {
			//These items are dropped into another frame, remove them from our model
			modelObj.value = modelObj.value.filter((i) => !selection.value.selectedIds.includes(i.id))
			view.value = view.value.filter((i) => !selection.value.selectedIds.includes(i.id))
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
