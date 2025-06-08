<template>
	<div
		class="boolean-group-card"
		:class="{ 'boolean-and': isAnd, 'boolean-or': isOr, 'boolean-selected': isSelected, 'boolean-true': isTrue }"
	>
		<div class="boolean-group-card-header">
			<i v-if="showDrag" class="mdi mdi-drag boolean-drag-handle" style="font-size: 2rem" />
			<boolean-group-operator-selector v-model="operator" local-path="operator" />
			<div style="flex: 1"></div>
			<p-button @click="addValue" class="extra-small-button"> Add Value </p-button>
			<p-button @click="addGroup" class="extra-small-button"> Add Group </p-button>
			<p-button v-if="showDrag" text icon="mdi mdi-delete" @click="emit('delete', $event)"></p-button>
		</div>
		<div class="boolean-group-card-body" ref="groupBody">
			<draggable-collection
				v-if="model"
				v-model="model.operands"
				handle-class="boolean-drag-handle"
				data-type="boolean-sub-expression"
				key-prop="id"
				style="gap: 0.25rem"
				local-path="operands"
			>
				<template #no-items>
					<div class="flex flex-column align-items-center p-3">No Conditions (Always On)</div>
				</template>
				<template #item="{ item, index }">
					<boolean-sub-expression
						v-model="model.operands[index]"
						:selected-ids="[]"
						@delete="deleteOperand(index)"
						:local-path="`[${index}]`"
					/>
				</template>
			</draggable-collection>
		</div>
	</div>
</template>

<script setup lang="ts">
import { BooleanSubExpressionGroup, BooleanValueExpression } from "castmate-schema"
import BooleanGroupOperatorSelector from "./BooleanGroupOperatorSelector.vue"
import BooleanValueExpressionEditor from "./BooleanValueExpressionEditor.vue"

import BooleanSubExpression from "./BooleanSubExpression.vue"
import { DocumentDataCollection, DraggableCollection, useCommitUndo, useDefaultableModel } from "../../../../main"

import { computed, ref, useModel } from "vue"
import PButton from "primevue/button"
import { useDrop } from "../../../../main"
import { nanoid } from "nanoid/non-secure"
import { BooleanExpressionGroup } from "castmate-schema"
import { useBooleanExpressionEvaluator } from "./boolean-helpers"

const props = withDefaults(
	defineProps<{
		modelValue: BooleanExpressionGroup | undefined
		showDrag?: boolean
		selectedIds: string[]
	}>(),
	{
		showDrag: true,
	}
)

const emit = defineEmits(["update:modelValue", "delete"])

const model = useModel(props, "modelValue")

const commitUndo = useCommitUndo()

const isAnd = computed(() => {
	return model.value && model.value.operands.length > 1 && model.value.operator == "and"
})

const isOr = computed(() => {
	return model.value && model.value.operands.length > 1 && model.value.operator == "or"
})

function addValue() {
	const defaultValueExpression: BooleanValueExpression = {
		type: "value",
		id: nanoid(),
		lhs: {
			type: "state",
			plugin: undefined,
			state: undefined,
		},
		rhs: {
			type: "value",
			schemaType: "String",
			value: undefined,
		},
		operator: "equal",
	}

	if (!model.value) {
		model.value = {
			type: "group",
			operator: "or",
			operands: [defaultValueExpression],
		}
		commitUndo()
		return
	}

	model.value.operands.push(defaultValueExpression)
	commitUndo()
}

function addGroup() {
	const defaultGroup: BooleanSubExpressionGroup = {
		id: nanoid(),
		type: "group",
		operator: "or",
		operands: [],
	}

	if (!model.value) {
		model.value = {
			type: "group",
			operator: "and",
			operands: [defaultGroup],
		}
	} else {
		model.value.operands.push(defaultGroup)
	}

	commitUndo()
}

function deleteOperand(index: number) {
	if (!model.value) return
	model.value.operands.splice(index, 1)
	commitUndo()
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
				type: "group",
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

const isSelected = computed(() =>
	props.modelValue && "id" in props.modelValue ? props.selectedIds.includes(props.modelValue.id as string) : false
)

const isTrue = useBooleanExpressionEvaluator(() => props.modelValue)
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

.boolean-group-card.boolean-selected {
	border-color: white !important;
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

.boolean-and > .boolean-group-card-header {
	background-color: var(--and-color);
}

.boolean-or > .boolean-group-card-header {
	background-color: var(--or-color);
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

.boolean-true > .boolean-group-card-body {
	background-color: var(--true-color);
}

.empty-body {
	height: 6rem;
}

.boolean-drag-handle {
	cursor: grab;
}
</style>
