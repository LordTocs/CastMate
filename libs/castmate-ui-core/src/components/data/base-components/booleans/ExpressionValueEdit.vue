<template>
	<div class="boolean-expression">
		<p-tab-view v-model:active-index="tabModel">
			<p-tab-panel header="State">
				<state-selector v-model="stateModel" input-id="state" :required="true" />
			</p-tab-panel>
			<p-tab-panel header="Value">
				<p-dropdown
					v-model="valueTypeModel"
					:options="variableTypeOptions"
					option-value="code"
					option-label="name"
					input-id="type"
					class="w-full mb-4"
					v-if="valueSchemaTypes.length > 1"
				/>
				<data-input v-model="valueModel" v-if="valueSchema" :schema="valueSchema" />
			</p-tab-panel>
		</p-tab-view>
	</div>
</template>

<script setup lang="ts">
import { Schema, ExpressionValue, isStateValueExpr, isValueValueExpr } from "castmate-schema"
import PTabView from "primevue/tabview"
import PTabPanel from "primevue/tabpanel"
import StateSelector from "../state/StateSelector.vue"
import DataInput from "../../DataInput.vue"
import { computed, useModel, watch } from "vue"
import { getTypeByName } from "castmate-schema"

import type { MenuItem } from "primevue/menuitem"
import PDropdown from "primevue/dropdown"
import { getAllVariableTypes } from "castmate-schema"
import { getTypeByConstructor } from "castmate-schema"

const props = defineProps<{
	modelValue: ExpressionValue
	leftSchema?: Schema
}>()

const model = useModel(props, "modelValue")

const stateModel = computed({
	get() {
		if (!isStateValueExpr(model.value)) return undefined
		return {
			plugin: model.value.plugin,
			state: model.value.state,
		}
	},
	set(v) {
		if (!v) return
		if (!isStateValueExpr(model.value)) {
			model.value = {
				type: "state",
				plugin: v.plugin,
				state: v.state,
			}
			return
		}

		model.value.plugin = v.plugin
		model.value.state = v.state
	},
})

const valueSchema = computed<Schema | undefined>(() => {
	if (!isValueValueExpr(model.value)) {
		return undefined
	}

	const type = getTypeByName(model.value.schemaType)
	if (!type) return undefined

	let baseSchema = props.leftSchema?.type == type.constructor ? props.leftSchema : {}

	const result: Schema = {
		...baseSchema,
		type: type.constructor,
		required: true,
		name: undefined,
		template: true,
	}

	return result
})

const valueModel = computed({
	get() {
		if (!isValueValueExpr(model.value)) {
			return undefined
		}
		return model.value.value
	},
	set(v) {
		if (!isValueValueExpr(model.value)) {
			model.value = {
				type: "value",
				schemaType: "String", //Todo: ???
				value: model.value,
			}
		} else {
			model.value.value = v
		}
	},
})

const valueTypeModel = computed({
	get() {
		if (!isValueValueExpr(model.value)) {
			return "String"
		}

		return model.value.schemaType
	},
	set(v) {
		if (!isValueValueExpr(model.value)) {
			model.value = {
				type: "value",
				schemaType: v,
				value: undefined,
			}
			return
		}

		model.value.schemaType = v
	},
})

const tabModel = computed({
	get() {
		if (model.value.type == "state") return 0
		if (model.value.type == "value") return 1
		return 2
	},
	set(v) {
		if (v == 0) {
			model.value = {
				type: "state",
				plugin: undefined,
				state: undefined,
			}
		} else if (v == 1) {
			model.value = {
				type: "value",
				schemaType: valueSchemaTypes.value[0] ?? "String",
				value: undefined,
			}
		}
	},
})

function definedString(str: string | undefined): str is string {
	return str != null
}

const valueSchemaTypes = computed(() => {
	if (!props.leftSchema) {
		return getAllVariableTypes().map((t) => t.name)
	} else {
		const metaData = getTypeByConstructor(props.leftSchema.type)
		return (
			metaData?.comparisonTypes?.map((t) => getTypeByConstructor(t.otherType)?.name)?.filter(definedString) ?? []
		)
	}
})

const variableTypeOptions = computed<MenuItem[]>(() => {
	return valueSchemaTypes.value.map((v) => ({
		code: v,
		name: v,
	}))
})

watch(valueSchemaTypes, (value, oldValues) => {
	if (!value.includes(valueTypeModel.value)) {
		valueModel.value = undefined
		valueTypeModel.value = value[0]
	}
})
</script>

<style scoped></style>
