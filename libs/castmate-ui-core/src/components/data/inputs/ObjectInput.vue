<template>
	<div>
		<data-input
			class="mb-4"
			v-for="(prop, i) in Object.keys(schema.properties)"
			:key="prop"
			:model-value="getModelProp(prop)"
			@update:model-value="setModelProp(prop, $event)"
			:schema="schema.properties[prop]"
		/>
	</div>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { type SchemaObj } from "castmate-schema"
import DataInput from "../DataInput.vue"
import { computed } from "vue"

interface ObjType {
	[prop: string]: any
}

const props = defineProps<{
	schema: SchemaObj
	modelValue: ObjType | undefined
}>()

const emit = defineEmits(["update:modelValue"])

function getModelProp(prop: string) {
	return props.modelValue?.[prop]
}

function setModelProp(prop: string, value: any) {
	const result = { ...props.modelValue }

	if (value != null) {
		result[prop] = value
	} else {
		delete result[prop]
	}

	if (Object.keys(result).length == 0) {
		return emit("update:modelValue", undefined)
	}
	return emit("update:modelValue", result)
}
</script>
