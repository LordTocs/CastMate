<template>
	<div class="state-expression-value" ref="expressionDiv" :class="{ selected: isSelected, 'boolean-true': isTrue }">
		<div class="state-expression-left boolean-drag-handle">
			<i class="mdi mdi-drag" style="font-size: 2rem"></i>
		</div>
		<div class="state-expression-right">
			<state-selector
				v-if="model.lhs.type == 'state'"
				v-model="lhsState"
				:required="true"
				input-id="state"
				class="flex-grow-1 flex-shrink-0"
			></state-selector>
			<value-compare-operator-selector v-model="model.operator" />
			<div class="value-placeholder flex-shrink-0 flex-grow-1" v-if="!selectedState"></div>
			<data-input class="flex-shrink-0 flex-grow-1" v-model="rhsValue" v-else :schema="selectedState.schema" />
			<p-button icon="mdi mdi-delete" text @click="emit('delete', $event)"></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { BooleanValueExpression } from "castmate-schema"
import { computed, ref, useModel } from "vue"
import StateSelector from "../state/StateSelector.vue"
import ValueCompareOperatorSelector from "./ValueCompareOperatorSelector.vue"
import { DataInput, useState } from "../../../../main"
import PButton from "primevue/button"
import { useBooleanExpressionEvaluator } from "./boolean-helpers"

const props = defineProps<{
	modelValue: BooleanValueExpression
	selectedIds: string[]
}>()

const model = useModel(props, "modelValue")
const emit = defineEmits(["update:modelValue", "delete"])

const isSelected = computed(() => props.selectedIds.includes(model.value.id))

const isTrue = useBooleanExpressionEvaluator(() => props.modelValue)

const lhsState = computed({
	get() {
		if (model.value.lhs.type != "state") return undefined
		return {
			plugin: model.value.lhs.plugin,
			state: model.value.lhs.state,
		}
	},
	set(v) {
		if (model.value.lhs.type != "state") return
		if (!v) return

		model.value.lhs.plugin = v.plugin
		model.value.lhs.state = v.state
	},
})

const rhsValue = computed({
	get() {
		if (model.value.rhs.type != "value") return undefined
		return model.value.rhs.value
	},
	set(v) {
		if (v == null) {
			model.value.rhs = {
				type: "value",
				value: undefined,
			}
			return
		}

		model.value.rhs = {
			type: "value",
			value: v,
		}
	},
})

const selectedState = useState(() => lhsState.value)
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

.boolean-true > .state-expression-right {
	background-color: var(--true-color);
}

.state-expression-right {
	flex: 1;
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem;
	padding-top: 1.6rem;
	background-color: var(--surface-0);
}

.boolean-drag-handle {
	cursor: grab;
}
</style>
