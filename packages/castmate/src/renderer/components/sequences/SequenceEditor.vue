<template>
	<div
		class="drag-area"
		ref="dragArea"
		@mousedown="startSelect"
		@keyup.delete.self="doDelete"
		tabindex="0"
		@copy="copy"
		@paste="paste"
		@cut="cut"
		@blur="blur"
		:draggable="false"
	>
		<draggable
			v-model="modelObj"
			item-key="id"
			handle=".handle"
			:group="{ name: 'actions' }"
			class="sequence-container"
			@dragstart="onSelectStart"
			ref="dragHandler"
		>
			<template #header>
				<v-card
					elevation="2"
					variant="outlined"
					shaped
					v-if="!(modelValue && modelValue.length > 0)"
				>
					<v-card-text>
						<p
							class="text-center text-h6"
							style="user-select: none"
						>
							Click &amp; Drag Actions from the Toolbox on the
							right.
						</p>
					</v-card-text>
				</v-card>
			</template>

			<template #item="{ element, index }">
				<sequence-item
					ref="sequenceItems"
					class="is-draggable"
					:selected="selected.includes(index)"
					:model-value="element"
					@update:model-value="(v) => updateAction(index, v)"
					@delete="deleteAction(index)"
				/>
			</template>
		</draggable>
		<div
			v-if="selectBox.dragging"
			ref="selectRect"
			class="select-rect"
			:style="{
				left: dragLeft + 'px',
				top: dragTop + 'px',
				width: dragWidth + 'px',
				height: dragHeight + 'px',
			}"
		></div>
		<select-dummy ref="selectDummy" />
	</div>
</template>

<script setup>
import SequenceItem from "./SequenceItem.vue"
import Draggable from "vuedraggable"
import _cloneDeep from "lodash/cloneDeep"
import { useModel } from "../../utils/modelValue"
import SelectDummy from "./SelectDummy.vue"
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useElementScroll } from "../../utils/events"

const props = defineProps({
	modelValue: {},
})
const emit = defineEmits(["update:modelValue"])
const modelObj = useModel(props, emit)

const selected = ref([])
const selectBox = ref({
	dragging: false,
	startX: 0,
	startY: 0,
	endX: 0,
	endY: 0,
})

const dragTop = computed(() =>
	selectBox.value.endY < selectBox.value.startY
		? selectBox.value.endY
		: selectBox.value.startY
)

const dragLeft = computed(() =>
	selectBox.value.endX < selectBox.value.startX
		? selectBox.value.endX
		: selectBox.value.startX
)
const dragWidth = computed(() =>
	Math.abs(selectBox.value.endX - selectBox.value.startX)
)
const dragHeight = computed(() =>
	Math.abs(selectBox.value.endY - selectBox.value.startY)
)

function updateAction(index, value) {
	let newValue = [...modelObj.value]
	newValue[index] = value
	emit("update:modelValue", newValue)
}
function deleteAction(index) {
	let newValue = [...modelObj.value]
	newValue.splice(index, 1)
	emit("update:modelValue", newValue)
}

const dragArea = ref(null)
const selectDummy = ref(null)
const dragHandler = ref(null)

function rectOverlap(r1, r2) {
	return (
		r1.left < r2.right &&
		r1.right > r2.left &&
		r1.top < r2.bottom &&
		r1.bottom > r2.top
	)
}

const scroll = useElementScroll(dragArea)

////////////////////////////////////////
/////////////SELECTION//////////////////
////////////////////////////////////////

function onSelectStart() {
	selected.value = []
	abandonSelect()
}

function getItemRect(item, areaRect) {
	const clientRect = item.getBoundingClientRect()

	const resultRect = {
		top: clientRect.top - areaRect.top + scroll.y.value,
		left: clientRect.left - areaRect.left + scroll.x.value,
		bottom: clientRect.bottom - areaRect.top + scroll.y.value,
		right: clientRect.right - areaRect.left + scroll.x.value,
	}

	return resultRect
}

function selectOverlapping() {
	if (!dragArea.value) {
		return
	}
	dragArea.value.focus()
	selectDummy.value.select()

	const areaRect = dragArea.value.getBoundingClientRect()
	const dragRect = {
		top: dragTop.value,
		left: dragLeft.value,
		bottom: dragTop.value + dragHeight.value,
		right: dragLeft.value + dragWidth.value
	}

	const newSelection = []

	const items =
		dragHandler.value.$el.querySelectorAll(".sequence-item")

	for (let i = 0; i < items.length; ++i) {
		const item = items[i]
		const itemRect = getItemRect(item, areaRect)

		if (rectOverlap(dragRect, itemRect)) {
			newSelection.push(i)
		}
	}

	selected.value = newSelection
}

function startSelect(e) {
	if (!dragArea.value) {
		return
	}

	const containerRect = dragArea.value.getBoundingClientRect()
	const x = e.clientX - containerRect.left + scroll.x.value
	const y = e.clientY - containerRect.top + scroll.y.value
	//console.log("Start Select", x, y)

	selectBox.value.startX = x
	selectBox.value.startY = y
	selectBox.value.endX = x
	selectBox.value.endY = y
	selectBox.value.dragging = true

	selectOverlapping()

	document.addEventListener("mousemove", moveSelect)
}

function moveSelect(e) {
	if (!dragArea.value) {
		return
	}
	const containerRect = dragArea.value.getBoundingClientRect()
	const x = e.clientX - containerRect.left + scroll.x.value
	const y = e.clientY - containerRect.top + scroll.y.value
	//console.log("Move Select", x, y)

	selectBox.value.endX = x
	selectBox.value.endY = y

	selectOverlapping()
}
function stopSelect(e) {
	if (!dragArea.value) {
		return
	}

	if (!selectBox.value.dragging) return

	selectOverlapping()
	abandonSelect()
}
function abandonSelect() {
	selectBox.value.dragging = false
	selectBox.value.startX = 0
	selectBox.value.startY = 0
	selectBox.value.endX = 0
	selectBox.value.endY = 0
	selectBox.value.dragging = false

	document.removeEventListener("mousemove", moveSelect)
}

////////////////////////////////////////
/////////////COPY PASTE/////////////////
////////////////////////////////////////

function copy(event) {
	if (selected.value.length == 0) return

	const clipData = []

	for (let idx of selected.value) {
		clipData.push(_cloneDeep(modelObj.value[idx]))
	}

	event.clipboardData.setData(
		"application/json",
		JSON.stringify(clipData)
	)
	event.preventDefault()
}
function paste(event) {
	console.log("Paste!")

	let paste = (event.clipboardData || window.clipboardData).getData(
		"application/json"
	)

	if (!paste || paste.length == 0) {
		return
	}

	try {
		const pasteData = JSON.parse(paste)

		for (let action of pasteData) {
			action.id = nanoid()
		}

		if (!(pasteData instanceof Array)) return

		//TODO: Validate JSON

		let newValue = [...modelObj.value]

		let insertIdx = newValue.length

		//If we have a current selection, overwrite it.
		if (selected.value.length != 0) {
			insertIdx = selected.value[0]

			let removed = 0
			for (let idx of selected.value) {
				newValue.splice(idx - removed, 1)
				removed += 1
			}
		}

		newValue.splice(insertIdx, 0, ...pasteData)
		emit("update:modelValue", newValue)
	} catch (err) {
		console.log("error pasting")
		console.log("Data: ", paste)
		console.log(err)
	} finally {
		event.preventDefault()
	}
}
function cut(event) {
	copy(event)
	doDelete()
}

function blur() {
	selected.value = []
}
function doDelete() {
	if (selected.value.length == 0) {
		return
	}

	let newValue = [...modelObj.value]

	let removed = 0
	for (let idx of selected.value) {
		newValue.splice(idx - removed, 1)
		removed += 1
	}

	emit("update:modelValue", newValue)
	selected.value = []
}

onMounted(() => {
	document.addEventListener("mouseup", stopSelect)
})

onUnmounted(() => {
	document.removeEventListener("mouseup", stopSelect)
})
</script>

<style scoped>
.sequence-container {
	padding: 16px;
	padding-bottom: 0;
	flex: 1;
}

.drag-area {
	display: flex;
	flex-direction: column;
	position: relative;
	overflow-x: hidden;
	height: 100%;
}

.drag-area:focus {
	outline: none !important;
}

.select-rect {
	pointer-events: none;
	user-select: none;
	position: absolute;
	border-width: 2px;
	border-color: white;
	mix-blend-mode: difference;
	border-style: dashed;
}
</style>
