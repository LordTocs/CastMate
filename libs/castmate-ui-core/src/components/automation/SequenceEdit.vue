<template>
	<div
		class="sequence"
		:class="{ floating }"
		:style="{ '--sequence-x': `${props.modelValue.x ?? 0}`, '--sequence-y': `${props.modelValue.y ?? 0}` }"
	>
		<sequence-start
			v-if="!floating"
			ref="sequenceStart"
			@request-test-run="$emit('requestTestRun')"
			@request-test-stop="$emit('requestTestStop')"
		>
			<automation-drop-zone
				v-if="!floating && modelObj.actions.length == 0"
				drop-axis="vertical"
				drop-location="middle"
				:drop-key="`trigger-right`"
				:key="`trigger-right`"
				style="
					right: calc(-1 * var(--instant-width) / 2);
					width: var(--instant-width);
					height: var(--timeline-height);
				"
				@automation-drop="onFrontDrop"
			/>
		</sequence-start>

		<sequence-actions-edit v-model="modelObj" @self-destruct="selfDestruct" ref="sequenceEdit" />
	</div>
</template>

<script setup lang="ts">
import { useModel, ref, provide, computed } from "vue"
import { Sequence, type NonStackActionInfo } from "castmate-schema"
import { type SelectionPos, type Selection, useDataBinding } from "../../main"
import SequenceActionsEdit from "./SequenceActionsEdit.vue"
import SequenceStart from "./SequenceStart.vue"
import AutomationDropZone from "./AutomationDropZone.vue"
import { SelectionGetter } from "../../util/automation-dragdrop"

const props = defineProps<{
	modelValue: Sequence & { x?: number; y?: number }
	floating: boolean
}>()

const modelObj = useModel(props, "modelValue")

provide(
	"sequence-floating",
	computed(() => props.floating)
)

const emit = defineEmits(["selfDestruct", "requestTestRun", "requestTestStop"])
function selfDestruct() {
	emit("selfDestruct")
}

function onFrontDrop(sequence: Sequence) {
	const newActions = [...props.modelValue.actions]

	newActions.splice(0, 0, ...sequence.actions)

	modelObj.value.actions = newActions
}

const sequenceStart = ref<SelectionGetter | null>(null)
const sequenceEdit = ref<SelectionGetter | null>(null)

defineExpose({
	getSelectedItems(container: HTMLElement, from: SelectionPos, to: SelectionPos): Selection {
		return [
			...(sequenceStart.value?.getSelectedItems(container, from, to) ?? []),
			...(sequenceEdit.value?.getSelectedItems(container, from, to) ?? []),
		]
	},
	deleteIds(ids: string[]) {
		if (sequenceEdit.value && !sequenceEdit.value.deleteIds(ids)) {
			selfDestruct()
		}
	},
})
</script>

<style scoped>
.sequence {
	display: flex;
	flex-direction: row;
}

.floating {
	position: absolute;
	left: calc(var(--sequence-x) * var(--time-width));
	top: calc(var(--sequence-y) * 1px);
}
</style>
