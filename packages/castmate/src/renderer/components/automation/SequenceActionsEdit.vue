<template>
	<div class="sequence-edit" :class="{ 'action-dragging': dragging }" ref="sequenceEdit" draggable="true">
		<time-action-edit v-if="isTimeAction(action)" v-model="(action as TimeAction)" />
		<action-stack-edit v-else-if="isActionStack(action)" v-model="(action as ActionStack)" />
		<instant-action-edit v-else v-model="(action as InstantAction)" />
		<automation-drop-zone
			drop-axis="vertical"
			drop-location="middle"
			:drop-key="`${action.id}-left`"
			style="left: calc(var(--instant-width) / -2); width: var(--instant-width); height: var(--timeline-height)"
		/>
		<automation-drop-zone
			v-if="offset == 0"
			drop-axis="vertical"
			drop-location="middle"
			:drop-key="`${action.id}-right`"
			style="right: calc(var(--instant-width) / -2); width: var(--instant-width); height: var(--timeline-height)"
		/>
		<sequence-actions-edit
			v-model="modelObj"
			:offset="offset + 1"
			v-if="offset + 1 < modelObj?.actions?.length"
		></sequence-actions-edit>
	</div>
</template>

<script setup lang="ts">
import InstantActionEdit from "./InstantActionEdit.vue"
import ActionStackEdit from "./ActionStackEdit.vue"
import TimeActionEdit from "./TimeActionEdit.vue"
import { SequenceActions } from "castmate-schema"
import { isTimeAction, isFlowAction, isActionStack } from "castmate-schema"
import { computed, useModel, ref } from "vue"
import { type TimeAction, type ActionStack, type InstantAction } from "castmate-schema"
import { useSequenceDrag } from "../../util/automation-dragdrop"
import _cloneDeep from "lodash/cloneDeep"
import AutomationDropZone from "./AutomationDropZone.vue"

const props = withDefaults(
	defineProps<{
		modelValue: SequenceActions
		offset?: number
	}>(),
	{ offset: 0 }
)
const modelObj = useModel(props, "modelValue")

const sequenceEdit = ref<HTMLElement | null>(null)

const { dragging } = useSequenceDrag(
	sequenceEdit,
	() => {
		return { actions: _cloneDeep(modelObj.value.actions.slice(props.offset)) }
	},
	() => {}
)

const action = computed({
	get() {
		return modelObj.value.actions[props.offset]
	},
	set(v) {
		modelObj.value.actions[props.offset] = v
	},
})
</script>

<style scoped>
.sequence-edit {
	display: flex;
	flex-direction: row;
	position: relative;
}

.sequence-edit.action-dragging {
	opacity: 0.25;
}
</style>
