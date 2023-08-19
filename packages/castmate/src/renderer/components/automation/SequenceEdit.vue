<template>
	<div
		class="sequence"
		:class="{ floating }"
		:style="{ '--sequence-x': `${props.modelValue.x ?? 0}`, '--sequence-y': `${props.modelValue.y ?? 0}` }"
	>
		<sequence-start v-if="!floating"></sequence-start>
		<sequence-actions-edit v-model="modelObj" @self-destruct="selfDestruct" />
	</div>
</template>

<script setup lang="ts">
import { useModel } from "vue"
import { Sequence, type NonStackActionInfo } from "castmate-schema"
import SequenceActionsEdit from "./SequenceActionsEdit.vue"
import SequenceStart from "./SequenceStart.vue"

const props = defineProps<{
	modelValue: Sequence & { x?: number; y?: number }
	floating: boolean
}>()

const modelObj = useModel(props, "modelValue")

const emit = defineEmits(["selfDestruct"])
function selfDestruct() {
	emit("selfDestruct")
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
