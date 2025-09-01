<template>
	<div
		ref="dragArea"
		class="draggable-collection"
		:class="{
			'draggable-horizontal': props.direction == 'horizontal',
			'draggable-vertical': props.direction == 'vertical',
		}"
	>
		<slot name="no-items" v-if="!model || model.length == 0"></slot>
		<div
			v-else
			v-for="(item, i) in model"
			:key="getKey(item)"
			draggable="true"
			@mousedown="onItemMouseDown(i, $event)"
			@dragstart="onItemDragStart(i, $event)"
			@dragend="onItemDragEnd(i, $event)"
			:ref="(el) => setDataCompRef(i, el as HTMLElement)"
		>
			<slot name="item" :item="model[i]" :index="i"> </slot>
		</div>
	</div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { VNode, computed, ref, useModel } from "vue"
import {
	ClientPosition,
	isChildOfClass,
	useDragEnter,
	useDragLeave,
	useDrop,
	useDragOver,
	useDataBinding,
	usePropagationImmediateStop,
	useCommitUndo,
} from "../../main"
import { useOrderedRefs } from "./OrderedTemplateRefs"
import _isEqual from "lodash/isEqual"

const props = withDefaults(
	defineProps<{
		keyProp?: keyof T
		direction?: "horizontal" | "vertical"
		handleClass: string
		dataType: string
		localPath?: string
	}>(),
	{
		direction: "vertical",
	}
)

useDataBinding(() => props.localPath)

const commitUndo = useCommitUndo()

const model = defineModel<T[]>({ default: () => [] })

const dragArea = ref<HTMLElement>()

function getKey(item: T) {
	if (props.keyProp) {
		return item[props.keyProp]
	}
}

function getIndex(data: T) {
	if (props.keyProp) {
		//@ts-ignore
		return model.value.findIndex((item) => item[props.keyProp] == data[props.keyProp])
	} else {
		return model.value.findIndex((item) => _isEqual(item, data))
	}
}

const dragTarget = ref<HTMLElement>()
const draggingItem = ref(false)

const { orderedElements: dragItemDivs, setRef: setDataCompRef } = useOrderedRefs<HTMLElement>(() => model.value || [])

const insertionIndex = ref(0)

const stopImmediatePropagation = usePropagationImmediateStop()

function calculateInsertIndex(ev: ClientPosition) {
	let result = 0

	for (let i = 0; i < dragItemDivs.value.length; ++i) {
		const component = dragItemDivs.value[i]
		if (!component) continue

		const boundingRect = component.getBoundingClientRect()

		if (props.direction == "horizontal") {
			const hx = (boundingRect.left + boundingRect.right) / 2

			if (ev.clientX > hx) {
				result = i + 1
			}

			if (boundingRect.left > ev.clientX) break
		} else {
			const hy = (boundingRect.top + boundingRect.bottom) / 2

			if (ev.clientY > hy) {
				result = i + 1
			}

			if (boundingRect.top > ev.clientY) break
		}
	}

	return result
}

function onItemMouseDown(index: number, ev: MouseEvent) {
	if (ev.button != 0) return

	const elem = ev.target as HTMLElement
	if (isChildOfClass(elem, props.handleClass)) {
		stopImmediatePropagation(ev)
		dragTarget.value = elem
	}
}

function onItemDragStart(index: number, ev: DragEvent) {
	if (!ev.dataTransfer) return

	if (!dragTarget.value) {
		ev.preventDefault()
		ev.stopPropagation()
		return
	}

	draggingItem.value = true

	ev.dataTransfer.effectAllowed = ev.altKey ? "copy" : "move"
	//TODO: Copy how to change ids?
	ev.dataTransfer.setData(props.dataType, JSON.stringify(model.value[index]))

	ev.stopPropagation()
}

async function onItemDragEnd(index: number, ev: DragEvent) {
	if (!ev.dataTransfer) return
	dragTarget.value = undefined

	if (ev.dataTransfer.dropEffect == "move") {
		if (!droppedLocal.value) {
			console.log("Finish Drop")
			//We get here when we try to move the item to a list that isn't this one.
			//Because of the ordering of dragend and drop we can't modify the v-model here
			//for when an item is dragged and dropped in the same list
			model.value.splice(index, 1)

			commitUndo()
		}
	}

	draggingItem.value = false
	droppedLocal.value = false //Reset the flag so future drops can ues it
}

const dragHovering = ref(false)

useDragEnter(
	dragArea,
	() => props.dataType,
	(ev) => {
		dragHovering.value = true
	}
)

useDragLeave(
	dragArea,
	() => props.dataType,
	(ev) => {
		dragHovering.value = false
	}
)

useDragOver(
	dragArea,
	() => props.dataType,
	(ev) => {
		insertionIndex.value = calculateInsertIndex(ev)
	}
)

const droppedLocal = ref(false)

useDrop(
	dragArea,
	() => props.dataType,
	async (ev) => {
		dragHovering.value = false

		const dataStr = ev.dataTransfer.getData(props.dataType)

		let data: T
		try {
			data = JSON.parse(dataStr)
		} catch (err) {
			return
		}

		let insertionIdx = calculateInsertIndex(ev)
		console.log("Inserting At", insertionIdx)

		if (ev.dataTransfer.effectAllowed == "move" && draggingItem.value) {
			//We're dropping an item from this list which means we both remove and insert the element here.
			droppedLocal.value = true

			const oldIdx = getIndex(data)

			if (oldIdx >= 0) {
				model.value.splice(oldIdx, 1)
				if (oldIdx < insertionIdx) {
					insertionIdx--
					console.log("Walking Back", insertionIdx)
				}
			}
		}

		if (ev.dataTransfer.effectAllowed == "move" || ev.dataTransfer.effectAllowed == "copy") {
			//Just do the insertion
			console.log("Insert", insertionIdx)
			model.value.splice(insertionIdx, 0, data)

			commitUndo()
		}
	}
)
</script>

<style scoped>
.draggable-collection {
	display: flex;
}

.draggable-collection.draggable-horizontal {
	flex-direction: row;
}

.draggable-collection.draggable-vertical {
	flex-direction: column;
}
</style>
