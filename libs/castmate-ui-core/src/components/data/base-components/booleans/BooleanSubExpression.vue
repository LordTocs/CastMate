<template>
	<boolean-group-expression
		v-if="isBooleanGroup(model)"
		v-model="model"
		:selected-ids="selectedIds"
		@delete="emit('delete', $event)"
	/>
	<boolean-value-expression-editor
		v-else-if="isBooleanValueExpr(model)"
		v-model="model"
		:selected-ids="selectedIds"
		@delete="emit('delete', $event)"
	/>
</template>

<script setup lang="ts">
import { BooleanSubExpression, BooleanValueExpression, BooleanExpressionGroup } from "castmate-schema"
import BooleanGroupExpression from "./BooleanGroupExpression.vue"
import BooleanValueExpressionEditor from "./BooleanValueExpressionEditor.vue"
import { useModel } from "vue"
import { isBooleanGroup } from "castmate-schema"
import { isBooleanRangeExpr } from "castmate-schema"
import { isBooleanValueExpr } from "castmate-schema"

const props = defineProps<{
	modelValue: BooleanSubExpression
	selectedIds: string[]
}>()

const emit = defineEmits(["update:modelValue", "delete"])

const model = useModel(props, "modelValue")
</script>
