<template>
	<div class="group-condition p-1">
		<div class="condition-header flex flex-row">
			<div class="flex-grow-1"></div>
			<p-button
				text
				size="small"
				:icon="excluded ? 'mdi mdi-equal' : 'mdi mdi-not-equal-variant'"
				@click="excluded = !excluded"
			></p-button>
			<p-button text size="small" icon="mdi mdi-delete" @click="emit('delete')"></p-button>
		</div>
		<div class="flex flex-row align-items-center gap-2">
			<div class="flex-grow-1">
				<viewer-variable-selector v-model="model.varname" />
			</div>
			<value-compare-operator-selector v-model="model.operator" :inequalities="inequalities" />
			<boolean-expression-value-edit
				v-model="model.operand"
				:left-schema="variable?.schema"
				class="w-0 flex-grow-1 flex-shrink-0 align-self-stretch"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { TwitchViewer, TwitchViewerGroupCondition } from "castmate-plugin-twitch-shared"
import { getTypeByConstructor, Schema, isStateValueExpr, isValueValueExpr, getTypeByName } from "castmate-schema"
import {
	ValueCompareOperatorSelector,
	BooleanExpressionValueEdit,
	useViewerDataStore,
	ViewerVariableSelector,
	usePluginStore,
} from "castmate-ui-core"
import { useModel, computed, watch } from "vue"

import PButton from "primevue/button"

const props = defineProps<{
	modelValue: TwitchViewerGroupCondition
	excluded: boolean
}>()

const model = useModel(props, "modelValue")
const excluded = useModel(props, "excluded")
const emit = defineEmits(["delete"])

const viewerVariableStore = useViewerDataStore()

const variable = computed(() => {
	if (!props.modelValue?.varname) return undefined
	return viewerVariableStore.variables.get(props.modelValue.varname)
})

const pluginStore = usePluginStore()

const rightSchema = computed<Schema | undefined>(() => {
	if (isStateValueExpr(model.value.operand)) {
		if (!model.value.operand.plugin) return undefined
		if (!model.value.operand.state) return undefined

		const state = pluginStore.pluginMap.get(model.value.operand.plugin)?.state?.[model.value.operand?.state]
		return state?.schema
	} else if (isValueValueExpr(model.value.operand)) {
		const constructor = getTypeByName(model.value.operand.schemaType)?.constructor
		if (!constructor) return undefined
		return {
			type: constructor,
		}
	}
})

const inequalities = computed(() => {
	if (!variable.value) return false
	if (!rightSchema.value) return false

	const variableMetaData = getTypeByConstructor(variable.value.schema.type)
	if (!variableMetaData) return false
	const rightMetaData = getTypeByConstructor(rightSchema.value.type)
	if (!rightMetaData) return false

	const comparison = variableMetaData.comparisonTypes.find(
		(ct) => rightSchema.value && ct.otherType == rightSchema.value.type
	)
	return comparison?.inequalities ?? false
})

watch(
	inequalities,
	() => {
		console.log("INEQUALITIES", inequalities.value)
	},
	{ immediate: true }
)
</script>

<style></style>
