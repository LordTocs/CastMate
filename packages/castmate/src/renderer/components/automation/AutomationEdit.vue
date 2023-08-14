<template>
	<div ref="editArea" class="automation-edit">
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
		<pan-area class="automation-edit grid-paper" v-model:panState="view.panState" :zoom-y="false">
			<sequence-edit v-model="model" :floating="false" />
		</pan-area>
	</div>
</template>

<script setup lang="ts">
import { ref, useModel } from "vue"
import { type Sequence } from "castmate-schema"
import { PanArea, SequenceView, provideDocumentPath } from "castmate-ui-core"
import SequenceEdit from "./SequenceEdit.vue"
import { provideAutomationEditState } from "../../util/automation-dragdrop"
import { useSelectionRect } from "castmate-ui-core"

const props = defineProps<{
	modelValue: Sequence
	view: SequenceView
	localPath?: string
}>()

const editArea = ref<HTMLElement | null>(null)

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const path = provideDocumentPath(() => props.localPath)

provideAutomationEditState(editArea)

const {
	selecting,
	from: selectFrom,
	to: selectTo,
} = useSelectionRect(
	editArea,
	(from, to) => {
		return []
	},
	path
)
</script>

<style scoped>
.automation-edit {
	--timeline-height: 120px;
	--point-size: 15px;
	--instant-width: 120px;
	--time-handle-height: 15px;
	--time-handle-width: 15px;
	--time-width: calc(var(--zoom-x) * 40px);

	width: 100%;
	height: 100%;
	position: relative;
}

.grid-paper {
	background: linear-gradient(-90deg, var(--surface-d) 1px, transparent 1px),
		linear-gradient(0deg, var(--surface-d) 1px, transparent 1px);
	background-size: calc(var(--zoom-x) * 40px) var(--timeline-height),
		calc(var(--zoom-x) * 40px) var(--timeline-height);
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
