<template>
	<div class="boolean-group-card" :class="{ 'boolean-and': isAnd, 'boolean-or': isOr }" :draggable="showDrag">
		<div class="boolean-group-card-header">
			<i v-if="showDrag" class="mdi mdi-drag boolean-drag-handle" style="font-size: 2rem" />
			<boolean-group-operator-selector v-model="operator" />
			<div style="flex: 1"></div>
			<p-button @click="addValue"> Add Value </p-button>
			<p-button @click="addGroup"> Add Group </p-button>
			<p-button v-if="showDrag" text icon="mdi mdi-delete" @click="emit('delete', $event)"></p-button>
		</div>
		<div class="boolean-group-card-body" ref="groupBody">
			<template v-if="model && model.operands.length > 0" v-for="(operand, i) in model.operands">
				<boolean-group-expression
					v-if="'operands' in operand"
					v-model="(model.operands[i] as BooleanExpressionGroup)"
					@delete="deleteOperand(i)"
				/>
				<boolean-value-expression-editor
					v-else
					v-model="(model.operands[i] as BooleanValueExpression)"
					@delete="deleteOperand(i)"
				/>
			</template>
			<div class="empty-body" v-else></div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { BooleanExpressionGroup, BooleanValueExpression } from "castmate-schema"
import BooleanGroupOperatorSelector from "./BooleanGroupOperatorSelector.vue"
import BooleanValueExpressionEditor from "./BooleanValueExpressionEditor.vue"
import { computed, ref, useModel } from "vue"
import PButton from "primevue/button"
import { useDrop } from "../../../../main"

const props = withDefaults(
	defineProps<{
		modelValue: BooleanExpressionGroup | undefined
		showDrag?: boolean
	}>(),
	{
		showDrag: true,
	}
)

const emit = defineEmits(["update:modelValue", "delete"])

const model = useModel(props, "modelValue")

const isAnd = computed(() => {
	return model.value && model.value.operands.length > 1 && model.value.operator == "and"
})

const isOr = computed(() => {
	return model.value && model.value.operands.length > 1 && model.value.operator == "or"
})

function addValue() {
	const defaultValueExpression: BooleanValueExpression = {
		lhs: {
			type: "state",
			plugin: undefined,
			state: undefined,
		},
		rhs: {
			type: "value",
			value: undefined,
		},
		operator: "equal",
	}

	if (!model.value) {
		model.value = {
			operator: "or",
			operands: [defaultValueExpression],
		}
		return
	}

	model.value.operands.push(defaultValueExpression)
}

function addGroup() {
	const defaultGroup: BooleanExpressionGroup = {
		operator: "or",
		operands: [],
	}

	if (!model.value) {
		model.value = {
			operator: "and",
			operands: [defaultGroup],
		}
	} else {
		model.value.operands.push(defaultGroup)
	}
}

function deleteOperand(index: number) {
	if (!model.value) return
	model.value.operands.splice(index, 1)
}

const operator = computed({
	get() {
		if (!model.value) {
			return "or"
		}
		return model.value.operator
	},
	set(v) {
		if (!model.value) {
			model.value = {
				operator: v,
				operands: [],
			}
			return
		}

		model.value.operator = v
	},
})

///DRAGGGGGIN

const groupBody = ref<HTMLElement>()

useDrop(groupBody, "boolean-sub-expression", (ev) => {
	console.log("Dropped")
})
</script>

<style scoped>
.boolean-group-card {
	border-radius: var(--border-radius);
	border: solid 2px var(--surface-border);
}

.boolean-group-card.boolean-and {
	border-color: green;
}

.boolean-group-card.boolean-or {
	border-color: blue;
}

.boolean-group-card-header {
	display: flex;
	flex-direction: row;
	background-color: var(--surface-300);
	padding: 0.25rem;
	gap: 0.5rem;

	border-top-right-radius: var(--border-radius);
	border-top-left-radius: var(--border-radius);
}

.boolean-and .boolean-group-card-header {
	background-color: green;
}

.boolean-or .boolean-group-card-header {
	background-color: blue;
}

.boolean-group-card-body {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 0.5rem;
	background-color: var(--surface-0);

	border-bottom-right-radius: var(--border-radius);
	border-bottom-left-radius: var(--border-radius);
}

.empty-body {
	height: 6rem;
}

.boolean-drag-handle {
	cursor: grab;
}
</style>
