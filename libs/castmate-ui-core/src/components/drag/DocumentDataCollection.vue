<template>
	<div
		class="drag-area"
		ref="dragArea"
		@dragover="dragOver"
		@dragenter="dragEnter"
		@dragleave="dragExit"
		@drop="dropped"
	>
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
			<component :is="dataComponent" v-model="modelObj[i]" :selected="selection"></component>
		</div>
	</div>
</template>

<script setup lang="ts">
import { type Component, ref } from "vue"
import { useVModel } from "@vueuse/core"
import { type DocumentData, type DocumentDataSelection } from "../../util/document"
import _cloneDeep from "lodash/cloneDeep"
import { nanoid } from "nanoid/non-secure"

const props = withDefaults(
	defineProps<{
		modelValue: DocumentData[]
		dataComponent: Component
		dataType?: string
		handleClass?: string
	}>(),
	{
		dataType: "document-data",
		handleClass: "drag-handle",
	}
)

const selection = ref<DocumentDataSelection>({
	selectedIds: [],
})

const emit = defineEmits(["update:modelValue"])

const modelObj = useVModel(props, "modelValue", emit)

///DRAG HANDLERS

const draggingItems = ref(false)
const dragArea = ref<HTMLElement | null>(null)
const dragHovering = ref(false)
const dataComponents = ref<HTMLElement[]>([])
const insertionIndex = ref<number>(0)

function dragOver(evt: DragEvent) {
	evt.preventDefault()
	evt.stopPropagation()

	if (!evt.dataTransfer) {
		console.log("NO DATA")
		return
	}

	if (!evt.dataTransfer.types.includes(props.dataType)) {
		console.log("No Types")
		return
	}

	console.log("DropEffect D", evt.dataTransfer?.dropEffect, evt.dataTransfer?.effectAllowed)

	if (evt.dataTransfer.effectAllowed == "move") evt.dataTransfer.dropEffect = "move"
	if (evt.dataTransfer.effectAllowed == "copy") evt.dataTransfer.dropEffect = "copy"

	insertionIndex.value = getInsertionIndex(evt.clientY)

	return false
}

interface FromTo {
	fromElement?: HTMLElement
	toElement?: HTMLElement
}

function dragEnter(evt: DragEvent) {
	console.log("DropEffect E", evt.dataTransfer?.dropEffect, evt.dataTransfer?.effectAllowed)

	if (!evt.dataTransfer) {
		console.log("No transfer")
		return
	}

	evt.preventDefault()
	evt.stopPropagation()

	if (!evt.dataTransfer.types.includes(props.dataType)) {
		console.log("No Types")
		return
	}

	//evt.dataTransfer.dropEffect = "move"

	if (dragHovering.value) {
		return
	}

	dragHovering.value = true
}

function dragExit(evt: DragEvent) {
	console.log("DropEffect L", evt.dataTransfer?.dropEffect, evt.dataTransfer?.effectAllowed)

	if (!evt.dataTransfer) {
		console.log("No transfer")
		return
	}

	evt.preventDefault()
	evt.stopPropagation()

	if (!evt.dataTransfer.types.includes(props.dataType)) {
		console.log("No Types")
		return
	}

	const ft = evt as FromTo
	if (ft.fromElement && dragArea.value?.contains(ft.fromElement)) {
		return
	}

	dragHovering.value = false
}

function getInsertionIndex(clientY: number) {
	let result = 0

	for (let i = 0; i < dataComponents.value.length; ++i) {
		const component = dataComponents.value[i]

		const boundingRect = component.getBoundingClientRect()

		const hy = (boundingRect.top + boundingRect.bottom) / 2

		if (clientY > hy) {
			result = i + 1
		}

		if (component.clientTop > clientY) {
			break
		}
	}

	return result
}

function dropped(evt: DragEvent) {
	console.log("Dropped", evt.target, evt)
	if (!evt.dataTransfer) {
		return
	}

	if (!evt.dataTransfer.types.includes(props.dataType)) {
		console.log("No Types")
		return
	}

	if (!dragArea.value) return

	evt.preventDefault()
	evt.stopPropagation()

	let insertionIdx = getInsertionIndex(evt.clientY)
	const dataStr = evt.dataTransfer.getData(props.dataType)
	let data: DocumentData[] = []

	try {
		data = JSON.parse(dataStr)
	} catch (err) {
		console.error("HOW DID WE GET HERE?")
		return
	}

	//console.log("DropEffect", evt.dataTransfer.dropEffect, evt.dataTransfer.effectAllowed)
	if (evt.dataTransfer.effectAllowed == "move" && draggingItems.value) {
		//We're moving internal items
		//Adjust the insertion index and remove the items from the model

		console.log("internal move")

		for (const id of selection.value.selectedIds) {
			const idx = modelObj.value.findIndex((i) => i.id == id)

			if (idx < 0) {
				continue
			}

			if (idx <= insertionIdx) {
				--insertionIdx
			}

			modelObj.value.splice(idx, 1)
		}
	}

	if (evt.dataTransfer.effectAllowed == "move" || evt.dataTransfer.effectAllowed == "copy") {
		modelObj.value.splice(insertionIdx, 0, ...data)
	}
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

/// DRAG ITEM HANDLERS

//In order to check if the handle class is respected we need to save off the mousedown event's target, since dragevent originates from the draggable div
let dragTarget: HTMLElement | null = null
function itemMouseDown(i: number, evt: MouseEvent) {
	dragTarget = evt.target as HTMLElement
}

function itemDragStart(i: number, evt: DragEvent) {
	console.log("Drag Start", evt.target, evt)

	if (!evt.target) return
	if (!evt.dataTransfer) return

	if (dragTarget && isChildOfClass(dragTarget, props.handleClass)) {
		draggingItems.value = true

		if (!selection.value.selectedIds.includes(modelObj.value[i].id)) {
			selection.value.selectedIds = [modelObj.value[i].id]
		}

		evt.dataTransfer.effectAllowed = evt.altKey ? "copy" : "move"
		evt.dataTransfer.setData(props.dataType, JSON.stringify(getSelectedData(evt.altKey)))
	} else {
		evt.preventDefault()
	}
}

function itemDragEnd(i: number, evt: DragEvent) {
	if (!evt.dataTransfer) return
	dragTarget = null

	console.log("DragEnd", evt.dataTransfer.dropEffect, evt.dataTransfer.effectAllowed)

	if (evt.dataTransfer.dropEffect == "none") {
		//No drop
	} else if (evt.dataTransfer.dropEffect == "move") {
		//Dropped somewhere
		if (!dragHovering.value) {
			console.log("External Move")
			//These items are dropped into another frame, remove them from our model
			modelObj.value = modelObj.value.filter((i) => !selection.value.selectedIds.includes(i.id))
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
.draggable-item {
}

.draggable-item:not(:last-of-type) {
	margin-bottom: 0.5rem;
}
</style>
