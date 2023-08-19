<template>
	<div
		class="sequence"
		:class="{ floating }"
		:style="{ '--sequence-x': `${props.modelValue.x ?? 0}`, '--sequence-y': `${props.modelValue.y ?? 0}` }"
	>
		<sequence-start v-if="!floating"></sequence-start>
		<automation-drop-zone
			v-if="!floating && modelObj.actions.length == 0"
			drop-axis="vertical"
			drop-location="middle"
			:drop-key="`trigger-right`"
			:key="`trigger-right`"
			style="left: calc(var(--instant-width) / 2); width: var(--instant-width); height: var(--timeline-height)"
			@automation-drop="onFrontDrop"
		/>
		<sequence-actions-edit v-model="modelObj" @self-destruct="selfDestruct" />
	</div>
</template>

<script setup lang="ts">
import { useModel } from "vue"
import { Sequence, type NonStackActionInfo } from "castmate-schema"
import SequenceActionsEdit from "./SequenceActionsEdit.vue"
import SequenceStart from "./SequenceStart.vue"
import AutomationDropZone from "./AutomationDropZone.vue"

const props = defineProps<{
	modelValue: Sequence & { x?: number; y?: number }
	floating: boolean
}>()

const modelObj = useModel(props, "modelValue")

const emit = defineEmits(["selfDestruct"])
function selfDestruct() {
	emit("selfDestruct")
}

function onFrontDrop(sequence: Sequence) {
	const newActions = [...props.modelValue.actions]

	newActions.splice(0, 0, ...sequence.actions)

	modelObj.value.actions = newActions
}
</script>

<style scoped>
.sequence {
	display: flex;
	flex-direction: row;
}

.floating {
	position: absolute;
	left: calc(var(--sequence-x) * var(--zoom-x) * 40px);
	top: calc(var(--sequence-y) * 1px);
}
</style>
