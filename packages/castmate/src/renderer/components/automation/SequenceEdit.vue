<template>
	<div
		class="sequence"
		:class="{ floating }"
		:style="{ '--sequence-x': `${props.modelValue.x ?? 0}`, '--sequence-y': `${props.modelValue.y ?? 0}` }"
	>
		<sequence-start v-if="!floating"></sequence-start>
		<sequence-actions-edit v-model="modelObj" />
	</div>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { Sequence, type NonStackActionInfo } from "castmate-schema"
import SequenceActionsEdit from "./SequenceActionsEdit.vue"
import SequenceStart from "./SequenceStart.vue"

const props = defineProps<{
	modelValue: Sequence & { x?: number; y?: number }
	floating: boolean
}>()

const emit = defineEmits(["update:modelValue"])
const modelObj = useVModel(props, "modelValue", emit)
</script>

<style scoped>
.sequence {
	display: flex;
	flex-direction: row;
}
</style>
