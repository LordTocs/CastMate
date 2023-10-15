<template>
	<boolean-group-expression
		v-if="'operands' in model"
		v-model="(model as BooleanExpressionGroup)"
		:selected-ids="selectedIds"
		@delete="emit('delete', $event)"
	/>
	<boolean-value-expression-editor
		v-else
		v-model="(model as BooleanValueExpression)"
		:selected-ids="selectedIds"
		@delete="emit('delete', $event)"
	/>
</template>

<script setup lang="ts">
import { BooleanSubExpression, BooleanValueExpression, BooleanExpressionGroup } from "castmate-schema"
import BooleanGroupExpression from "./BooleanGroupExpression.vue"
import BooleanValueExpressionEditor from "./BooleanValueExpressionEditor.vue"
import { useModel } from "vue"

const props = defineProps<{
	modelValue: BooleanSubExpression
	selectedIds: string[]
}>()

const emit = defineEmits(["update:modelValue", "delete"])

const model = useModel(props, "modelValue")
</script>
