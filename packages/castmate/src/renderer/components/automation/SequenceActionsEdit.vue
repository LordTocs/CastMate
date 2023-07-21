<template>
	<template v-for="(a, i) in props.modelValue.actions" :key="a.id">
		<time-action-edit v-if="isTimeAction(modelObj.actions[i])" v-model="(modelObj.actions[i] as TimeAction)" />
		<action-stack-edit
			v-else-if="isActionStack(modelObj.actions[i])"
			v-model="(modelObj.actions[i] as ActionStack)"
		/>
		<instant-action-edit v-else v-model="(modelObj.actions[i] as InstantAction)" />
	</template>
</template>

<script setup lang="ts">
import InstantActionEdit from "./InstantActionEdit.vue"
import ActionStackEdit from "./ActionStackEdit.vue"
import TimeActionEdit from "./TimeActionEdit.vue"
import { SequenceActions } from "castmate-schema"
import { isTimeAction, isFlowAction, isActionStack } from "castmate-schema"
import { useModel } from "vue"
import { type TimeAction, type ActionStack, type InstantAction } from "castmate-schema"

const props = defineProps<{
	modelValue: SequenceActions
}>()
const modelObj = useModel(props, "modelValue")
</script>
