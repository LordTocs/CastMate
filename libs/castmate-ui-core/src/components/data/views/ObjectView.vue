<template>
	<div class="data-obj">
		<div class="data-obj-prop" v-for="(prop, i) in Object.keys(schema.properties)" :key="prop">
			<data-view
				v-if="getModelProp(prop) != null"
				:model-value="getModelProp(prop)"
				:schema="schema.properties[prop]"
				:context="context"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { SchemaObj } from "castmate-schema"
import DataView from "../DataView.vue"
import { SharedDataViewProps } from "../DataInputTypes"
const props = defineProps<
	{
		modelValue: { [prop: string]: any } | undefined
		schema: SchemaObj
	} & SharedDataViewProps
>()

function getModelProp(prop: string) {
	return props.modelValue?.[prop]
}
</script>
