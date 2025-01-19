<template>
	<div class="boolean-expression">
		<p-tabs v-model:value="tabModel">
			<p-tab-list>
				<p-tab value="0" class="small-tab">State</p-tab>
				<p-tab value="1" class="small-tab">Value</p-tab>
			</p-tab-list>
			<p-tab-panels>
				<p-tab-panel value="0">
					<state-selector v-model="stateModel" input-id="state" :required="true" />
				</p-tab-panel>
				<p-tab-panel value="1">
					<div class="flex flex-row gap-1 align-items-center">
						<p-select
							v-model="valueTypeModel"
							:options="variableTypeOptions"
							option-value="code"
							option-label="name"
							input-id="type"
							v-if="valueSchemaTypes.length > 1"
						>
							<template #value="slotProps">
								<div v-if="slotProps.value" class="flex items-center">
									<i :class="valueSchemaTypes.find((to) => to.name == slotProps.value)?.icon" />
								</div>
								<span v-else>
									{{ slotProps.placeholder }}
								</span>
							</template>
						</p-select>
						<data-input
							local-path="value"
							class="w-full"
							v-model="valueModel"
							v-if="valueSchema"
							:schema="valueSchema"
						/>
					</div>
				</p-tab-panel>
			</p-tab-panels>
		</p-tabs>
	</div>
</template>

<script setup lang="ts">
import { Schema, ExpressionValue, isStateValueExpr, isValueValueExpr, FullDataTypeMetaData } from "castmate-schema"
import PTabs from "primevue/tabs"
import PTab from "primevue/tab"
import PTabList from "primevue/tablist"
import PTabPanels from "primevue/tabpanels"
import PTabPanel from "primevue/tabpanel"

import StateSelector from "../state/StateSelector.vue"
import DataInput from "../../DataInput.vue"
import { computed, useModel, watch } from "vue"
import { getTypeByName } from "castmate-schema"

import type { MenuItem } from "primevue/menuitem"
import PSelect from "primevue/select"
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
		if (model.value.type == "state") return "0"
		if (model.value.type == "value") return "1"
		return 2
	},
	set(v) {
		if (v == "0") {
			model.value = {
				type: "state",
				plugin: undefined,
				state: undefined,
			}
		} else if (v == "1") {
			model.value = {
				type: "value",
				schemaType: valueSchemaTypes.value[0] ?? "String",
				value: undefined,
			}
		}
	},
})

function validMetaData(meta: FullDataTypeMetaData<any> | undefined): meta is FullDataTypeMetaData<any> {
	return meta?.name != null
}

const valueSchemaTypes = computed(() => {
	if (!props.leftSchema) {
		return getAllVariableTypes()
	} else {
		const metaData = getTypeByConstructor(props.leftSchema.type)
		if (!metaData) return []
		const comparisonTypes = metaData.comparisonTypes

		const comparisonTypeMetaDatas = comparisonTypes.map((t) => getTypeByConstructor(t.otherType))
		const filteredComparisonMetaDatas = comparisonTypeMetaDatas.filter(validMetaData)

		return filteredComparisonMetaDatas
	}
})

const variableTypeOptions = computed<MenuItem[]>(() => {
	return valueSchemaTypes.value.map(
		(v) =>
			({
				code: v.name,
				name: v.name,
				icon: v.icon,
			} as MenuItem)
	)
})

watch(valueSchemaTypes, (value, oldValues) => {
	if (!value.find((meta) => meta.name == valueTypeModel.value)) {
		valueModel.value = undefined
		valueTypeModel.value = value[0].name
	}
})
</script>

<style scoped>
.boolean-expression :deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
	padding: 0.25rem 0.5rem;
}

.boolean-expression :deep(.p-tabview .p-tabview-panels) {
	padding: 0.75rem;
}

.small-tab {
	padding: 0.5rem;
}
</style>
