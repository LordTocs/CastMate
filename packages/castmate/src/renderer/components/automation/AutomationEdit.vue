<template>
	<div ref="editArea" class="automation-edit">
		<pan-area class="automation-edit grid-paper" v-model:panState="view.panState" :zoom-y="false">
			<sequence-edit v-model="model" :floating="false" />
		</pan-area>
	</div>
</template>

<script setup lang="ts">
import { ref, useModel } from "vue"
import { type Sequence } from "castmate-schema"
import { PanArea, SequenceView } from "castmate-ui-core"
import SequenceEdit from "./SequenceEdit.vue"
import { provideAutomationEditState } from "../../util/automation-dragdrop"

const props = defineProps<{
	modelValue: Sequence
	view: SequenceView
}>()

const editArea = ref<HTMLElement | null>(null)

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

provideAutomationEditState(editArea)
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
</style>
