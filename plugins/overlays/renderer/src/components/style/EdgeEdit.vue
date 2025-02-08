<template>
	<div
		class="edge-edit"
		:style="{
			'--edit-width-frac': editWidthFrac,
			'--edit-height-frac': editHeightFrac,
		}"
	>
		<div class="value-edit top" ref="top" :class="{ 'edit-drag': topDragging }">
			<margin-padding-num-edit v-model="model.top" local-path="top" />
		</div>
		<div class="value-edit left" ref="left" :class="{ 'edit-drag': leftDragging }">
			<margin-padding-num-edit v-model="model.left" local-path="left" />
		</div>
		<div class="value-edit right" ref="right" :class="{ 'edit-drag': rightDragging }">
			<margin-padding-num-edit v-model="model.right" local-path="right" />
		</div>
		<div class="value-edit bottom" ref="bottom" :class="{ 'edit-drag': bottomDragging }">
			<margin-padding-num-edit v-model="model.bottom" local-path="bottom" />
		</div>
	</div>
</template>

<script setup lang="ts">
import MarginPaddingNumEdit from "./MarginPaddingNumEdit.vue"
import { OverlayEdgeInfo } from "castmate-plugin-overlays-shared"
import { computed, ref, useModel } from "vue"
import { useCommitUndo, useDataBinding, useDragValue } from "castmate-ui-core"

const props = defineProps<{
	modelValue: OverlayEdgeInfo
	editHeightFrac: number
	editWidthFrac: number
	localPath: string
}>()

const model = useModel(props, "modelValue")

useDataBinding(() => props.localPath)

const top = ref<HTMLElement>()
const left = ref<HTMLElement>()
const right = ref<HTMLElement>()
const bottom = ref<HTMLElement>()

const dragScale = 3

const commitUndo = useCommitUndo()

const topDragging = useDragValue(
	top,
	computed({
		get() {
			return model.value.top
		},
		set(v) {
			model.value.top = v
		},
	}),
	{ direction: "vertical", scale: dragScale, min: 0 },
	() => commitUndo()
)

const leftDragging = useDragValue(
	left,
	computed({
		get() {
			return model.value.left
		},
		set(v) {
			model.value.left = v
		},
	}),
	{ direction: "horizontal", scale: dragScale, min: 0 },
	() => commitUndo()
)

const rightDragging = useDragValue(
	right,
	computed({
		get() {
			return model.value.right
		},
		set(v) {
			model.value.right = v
		},
	}),
	{ direction: "horizontal", scale: dragScale, invert: true, min: 0 },
	() => commitUndo()
)

const bottomDragging = useDragValue(
	bottom,
	computed({
		get() {
			return model.value.bottom
		},
		set(v) {
			model.value.bottom = v
		},
	}),
	{ direction: "vertical", scale: dragScale, invert: true, min: 0 },
	() => commitUndo()
)
</script>

<style scoped>
.edge-edit {
	position: relative;

	--edit-width: calc(100% * var(--edit-width-frac));
	--edit-height: calc(100% * var(--edit-height-frac));
}

.top {
	cursor: ns-resize;

	left: 0;
	top: 0;
	right: 0;
	bottom: calc(100% - var(--edit-height));

	clip-path: polygon(0 0, 100% 0, calc(100% - var(--edit-width)) 100%, var(--edit-width) 100%);
	/* background-color: blue; */
}

.left {
	cursor: ew-resize;

	left: 0;
	top: 0;
	right: calc(100% - var(--edit-width));
	bottom: 0;

	clip-path: polygon(0 0, 100% var(--edit-height), 100% calc(100% - var(--edit-height)), 0 100%);
	/* background-color: red; */
}

.right {
	cursor: ew-resize;

	left: calc(100% - var(--edit-width));
	top: 0;
	right: 0;
	bottom: 0;

	clip-path: polygon(0 var(--edit-height), 100% 0, 100% 100%, 0 calc(100% - var(--edit-height)));
	/* background-color: green; */
}

.bottom {
	cursor: ns-resize;

	left: 0;
	top: calc(100% - var(--edit-height));
	right: 0;
	bottom: 0;

	clip-path: polygon(var(--edit-width) 0, calc(100% - var(--edit-width)) 0, 100% 100%, 0 100%);
	/* background-color: yellow; */
}

.value-edit {
	position: absolute;
	display: flex;
	justify-content: center;
	align-items: center;

	background-color: var(--surface-b);
	border: solid 1px var(--surface-d);
	border-radius: var(--border-radius);
}

.value-edit:hover {
	background-color: var(--surface-100);
}

.value-edit.edit-drag {
	background-color: var(--surface-200) !important;
}
</style>
