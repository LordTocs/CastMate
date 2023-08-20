<template>
	<div class="sequence-edit" :class="{ 'action-dragging': dragging }" ref="sequenceEdit" draggable="true">
		<template v-if="modelValue.actions.length > 0">
			<time-action-edit v-if="isTimeAction(action)" v-model="(action as TimeAction)" />
			<action-stack-edit v-else-if="isActionStack(action)" v-model="(action as ActionStack)" />
			<instant-action-edit v-else v-model="(action as InstantAction)" />

			<automation-drop-zone
				drop-axis="vertical"
				drop-location="middle"
				:drop-key="`${action.id}-left`"
				:key="`${action.id}-left`"
				style="
					left: calc(var(--instant-width) / -2);
					width: var(--instant-width);
					height: var(--timeline-height);
				"
				@automation-drop="onLeftDrop"
			/>
			<automation-drop-zone
				v-if="offset == modelValue.actions.length - 1"
				drop-axis="vertical"
				drop-location="middle"
				:drop-key="`${action.id}-right`"
				:key="`${action.id}-right`"
				style="
					right: calc(var(--instant-width) / -2);
					width: var(--instant-width);
					height: var(--timeline-height);
				"
				@automation-drop="onRightDrop"
			/>
		</template>
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
import { Sequence } from "castmate-schema"

const props = withDefaults(
	defineProps<{
		modelValue: SequenceActions
		offset?: number
	}>(),
	{ offset: 0 }
)
const modelObj = useModel(props, "modelValue")

const sequenceEdit = ref<HTMLElement | null>(null)

const emit = defineEmits(["selfDestruct"])

const { dragging, draggingDelayed } = useSequenceDrag(
	sequenceEdit,
	() => {
		return { actions: _cloneDeep(modelObj.value.actions.slice(props.offset)) }
	},
	() => {
		console.log("Removing Sequence After", props.offset)
		const newActions = [...modelObj.value.actions]
		newActions.splice(props.offset, newActions.length - props.offset)
		modelObj.value.actions = newActions

		if (newActions.length == 0) {
			emit("selfDestruct")
		}
	}
)

const action = computed({
	get() {
		return modelObj.value.actions[props.offset]
	},
	set(v) {
		modelObj.value.actions[props.offset] = v
	},
})

function onLeftDrop(sequence: Sequence) {
	const newActions = [...props.modelValue.actions]

	newActions.splice(props.offset, 0, ...sequence.actions)

	modelObj.value.actions = newActions
}

function onRightDrop(sequence: Sequence) {
	const newActions = [...props.modelValue.actions, ...sequence.actions]

	modelObj.value.actions = newActions
}
</script>

<style scoped>
.sequence-edit {
	display: flex;
	flex-direction: row;
	position: relative;
	pointer-events: none;
}

.sequence-edit.action-dragging {
	opacity: 0.25;
}
</style>
