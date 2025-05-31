<template>
	<div class="state-expression-value" ref="expressionDiv" :class="{ 'boolean-true': isTrue }">
		<div class="state-expression-left boolean-drag-handle">
			<i class="mdi mdi-drag" style="font-size: 2rem"></i>
		</div>
		<div class="state-expression-middle">
			<expression-value-edit
				v-model="model.lhs"
				local-path="lhs"
				class="w-0 flex-grow-1 flex-shrink-0 align-self-stretch"
			/>
			<value-compare-operator-selector
				v-model="model.operator"
				:inequalities="inequalities"
				local-path="operator"
			/>
			<expression-value-edit
				v-model="model.rhs"
				local-path="rhs"
				:left-schema="leftSchema"
				class="w-0 flex-grow-1 flex-shrink-0 align-self-stretch"
			/>
		</div>
		<div class="state-expression-right">
			<p-button icon="mdi mdi-delete" text @click="emit('delete', $event)"></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { BooleanValueExpression } from "castmate-schema"
import { computed, ref, useModel } from "vue"
import StateSelector from "../state/StateSelector.vue"
import ValueCompareOperatorSelector from "./ValueCompareOperatorSelector.vue"
import { DataInput, usePluginStore, useState } from "../../../../main"
import PButton from "primevue/button"
import { useBooleanExpressionEvaluator } from "./boolean-helpers"

import ExpressionValueEdit from "./ExpressionValueEdit.vue"
import { isStateValueExpr } from "castmate-schema"
import { isValueValueExpr } from "castmate-schema"
import { getTypeByName } from "castmate-schema"
import { Schema } from "castmate-schema"
import { getTypeByConstructor } from "castmate-schema"

const props = defineProps<{
	modelValue: BooleanValueExpression
	selectedIds: string[]
}>()

const model = useModel(props, "modelValue")
const emit = defineEmits(["update:modelValue", "delete"])

const isTrue = useBooleanExpressionEvaluator(() => props.modelValue)

const pluginStore = usePluginStore()

const leftSchema = computed<Schema | undefined>(() => {
	if (isStateValueExpr(model.value.lhs)) {
		if (!model.value.lhs.plugin) return undefined
		if (!model.value.lhs.state) return undefined

		const state = pluginStore.pluginMap.get(model.value.lhs.plugin)?.state?.[model.value.lhs?.state]
		return state?.schema
	} else if (isValueValueExpr(model.value.lhs)) {
		const constructor = getTypeByName(model.value.lhs.schemaType)?.constructor
		if (!constructor) return undefined
		return {
			type: constructor,
		}
	}
})

const rightSchema = computed<Schema | undefined>(() => {
	if (isStateValueExpr(model.value.rhs)) {
		if (!model.value.rhs.plugin) return undefined
		if (!model.value.rhs.state) return undefined

		const state = pluginStore.pluginMap.get(model.value.rhs.plugin)?.state?.[model.value.rhs?.state]
		return state?.schema
	} else if (isValueValueExpr(model.value.rhs)) {
		const constructor = getTypeByName(model.value.rhs.schemaType)?.constructor
		if (!constructor) return undefined
		return {
			type: constructor,
		}
	}
})

const inequalities = computed(() => {
	if (!leftSchema.value) return false
	if (!rightSchema.value) return false
	const leftMetaData = getTypeByConstructor(leftSchema.value.type)
	if (!leftMetaData) return false
	const rightMetaData = getTypeByConstructor(rightSchema.value.type)
	if (!rightMetaData) return false

	const comparison = leftMetaData.comparisonTypes.find(
		(ct) => rightSchema.value && ct.otherType == rightSchema.value.type
	)
	return comparison?.inequalities ?? false
})
</script>

<style scoped>
.state-expression-value {
	position: relative;
	display: flex;
	flex-direction: row;
	align-items: center;

	border: solid 2px var(--surface-border);

	border-radius: var(--border-radius);
}

.state-expression-value.selected {
	border-color: white;
}

.state-expression-left {
	display: flex;
	flex-direction: row;
	align-items: center;
	align-self: stretch;
	padding: 0.25rem;

	border-top-left-radius: var(--border-radius);
	border-bottom-left-radius: var(--border-radius);

	background-color: var(--surface-300);
}

.boolean-true > .state-expression-middle {
	background-color: var(--true-color);
}

.state-expression-middle {
	flex: 1;
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.5rem;
	background-color: var(--surface-0);
}

.state-expression-right {
	display: flex;
	justify-content: center;
	align-items: center;
}

.boolean-drag-handle {
	cursor: grab;
}
</style>
