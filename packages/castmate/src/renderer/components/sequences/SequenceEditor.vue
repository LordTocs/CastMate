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
			@dragstart="onDragStart"
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
		/>
		<!-- This div is necessary so that there's "selectable content" otherwise the copy events wont fire -->
		<!--<div style="font-size: 0; height: 120px" draggable="false">...</div>-->
		<select-dummy ref="selectDummy" />
	</div>
</template>

<script>
import SequenceItem from "./SequenceItem.vue"
import Draggable from "vuedraggable"
import { ipcRenderer } from "electron"
import _cloneDeep from "lodash/cloneDeep"
import { nanoid } from "nanoid/non-secure"
import { mapModel } from "../../utils/modelValue"
import SelectDummy from "./SelectDummy.vue"
export default {
	components: { SequenceItem, Draggable, SelectDummy },
	props: {
		modelValue: {},
	},
	emits: ["update:modelValue"],
	data() {
		return {
			selected: [],
			selectBox: {
				dragging: false,
				startX: 0,
				startY: 0,
				endX: 0,
				endY: 0,
			},
		}
	},
	computed: {
		dragTop() {
			return this.selectBox.endY < this.selectBox.startY
				? this.selectBox.endY
				: this.selectBox.startY
		},
		dragLeft() {
			return this.selectBox.endX < this.selectBox.startX
				? this.selectBox.endX
				: this.selectBox.startX
		},
		dragWidth() {
			return Math.abs(this.selectBox.endX - this.selectBox.startX)
		},
		dragHeight() {
			return Math.abs(this.selectBox.endY - this.selectBox.startY)
		},
		...mapModel(),
	},
	methods: {
		getDraggableId(item) {
			return `${item.plugin}.${item.action}`
		},
		updateAction(index, value) {
			let newValue = _cloneDeep(this.modelValue)

			newValue[index] = value

			this.$emit("update:modelValue", newValue)
		},
		deleteAction(index) {
			let newValue = _cloneDeep(this.modelValue)

			newValue.splice(index, 1)

			this.$emit("update:modelValue", newValue)
		},
		newActionGroup() {
			let newValue = _cloneDeep(this.modelValue)
			newValue.push({})

			this.$emit("update:modelValue", newValue)
		},
		rectOverlap(r1, r2) {
			return (
				r1.left < r2.right &&
				r1.right > r2.left &&
				r1.top < r2.bottom &&
				r1.bottom > r2.top
			)
		},
		onDragStart() {
			this.selected = []
			this.abandonSelect()
		},
		doSelect() {
			if (!this.$refs.dragArea) {
				return
			}
			this.$refs.dragArea.focus()
			this.$refs.selectDummy.select()
			const areaRect = this.$refs.dragArea.getBoundingClientRect()
			const dragRect = {
				top: areaRect.top + this.dragTop,
				left: areaRect.left + this.dragLeft,
				bottom: areaRect.top + this.dragTop + this.dragHeight,
				right: areaRect.left + this.dragLeft + this.dragWidth,
			}

			const newSelection = []

			const items =
				this.$refs.dragHandler.$el.querySelectorAll(".sequence-item")

			for (let i = 0; i < items.length; ++i) {
				const item = items[i]
				const itemRect = item.getBoundingClientRect()

				if (this.rectOverlap(dragRect, itemRect)) {
					newSelection.push(i)
				}
			}

			//console.log(this.$refs.sequenceItems);

			/*for (let itemId in this.$refs.sequenceItems) {
        const item = this.$refs.sequenceItems[itemId];

        console.log("ITEM!", itemId, item);

        const itemRect = item.getBoundingClientRect
          ? item.getBoundingClientRect()
          : item.$el.getBoundingClientRect();

        if (this.rectOverlap(dragRect, itemRect)) {
          newSelection.push(Number(itemId));
        }
      }*/

			this.selected = newSelection
		},
		startSelect(e) {
			if (!this.$refs.dragArea) {
				return
			}
			let containerRect = this.$refs.dragArea.getBoundingClientRect()
			const x = e.clientX - containerRect.left
			const y = e.clientY - containerRect.top

			this.selectBox.startX = x
			this.selectBox.startY = y
			this.selectBox.endX = x
			this.selectBox.endY = y
			this.selectBox.dragging = true

			this.doSelect()

			document.addEventListener("mousemove", this.moveSelect)
		},
		moveSelect(e) {
			if (!this.$refs.dragArea) {
				return
			}
			let containerRect = this.$refs.dragArea.getBoundingClientRect()
			const x = e.clientX - containerRect.left
			const y = e.clientY - containerRect.top

			this.selectBox.endX = x
			this.selectBox.endY = y

			this.doSelect()
		},
		stopSelect(e) {
			if (!this.$refs.dragArea) {
				return
			}
			if (!this.selectBox.dragging) return
			let containerRect = this.$refs.dragArea.getBoundingClientRect()
			const x = e.clientX - containerRect.left
			const y = e.clientY - containerRect.top

			this.doSelect()

			this.abandonSelect()
		},
		abandonSelect() {
			this.selectBox.dragging = false
			this.selectBox.startX = 0
			this.selectBox.startY = 0
			this.selectBox.endX = 0
			this.selectBox.endY = 0
			this.selectBox.dragging = false

			document.removeEventListener("mousemove", this.moveSelect)
		},
		copy(event) {
			console.log("Copy!")

			if (this.selected.length == 0) return

			const clipData = []

			for (let idx of this.selected) {
				clipData.push(_cloneDeep(this.modelValue[idx]))
			}

			event.clipboardData.setData(
				"application/json",
				JSON.stringify(clipData)
			)
			event.preventDefault()
		},
		paste(event) {
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

				let newValue = _cloneDeep(this.modelValue)

				let insertIdx = newValue.length
				//If we have a current selection, overwrite it.
				if (this.selected.length != 0) {
					insertIdx = this.selected[0]

					let removed = 0
					for (let idx of this.selected) {
						newValue.splice(idx - removed, 1)
						removed += 1
					}
				}

				newValue.splice(insertIdx, 0, ...pasteData)
				this.$emit("update:modelValue", newValue)
			} catch (err) {
				console.log("error pasting")
				console.log("Data: ", paste)
				console.log(err)
			} finally {
				event.preventDefault()
			}
		},
		cut(event) {
			this.copy(event)
			this.doDelete()
		},
		blur() {
			this.clearSelection()
		},
		doDelete() {
			if (this.selected.length == 0) {
				return
			}

			let newValue = _cloneDeep(this.modelValue)

			let removed = 0
			for (let idx of this.selected) {
				newValue.splice(idx - removed, 1)
				removed += 1
			}

			this.$emit("update:modelValue", newValue)

			this.selected = []
		},
		clearSelection() {
			this.selected = []
		},
	},
	mounted() {
		document.addEventListener("mouseup", this.stopSelect)
		//document.addEventListener("touchend", this.stopSelect);

		//this.$refs.dragArea.addEventListener("copy", this.copy);

		//console.log("Bound copy event!");
	},
	destroyed() {
		document.removeEventListener("mouseup", this.stopSelect)
		//document.removeEventListener("touchend", this.stopSelect);

		//this.$refs.dragArea.removeEventListener("copy", this.copy);
	},
}
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
