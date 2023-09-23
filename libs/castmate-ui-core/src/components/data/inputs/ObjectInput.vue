<template>
	<document-path :local-path="localPath">
		<div class="data-input" tabindex="-1" v-bind="$attrs" @mousedown="onMouseDown">
			<data-input
				class="data-prop"
				v-for="(prop, i) in Object.keys(schema.properties)"
				:key="prop"
				:model-value="getModelProp(prop)"
				@update:model-value="setModelProp(prop, $event)"
				:schema="schema.properties[prop]"
				:local-path="prop"
			/>
		</div>
	</document-path>
</template>

<script setup lang="ts">
import { type SchemaObj } from "castmate-schema"
import DataInput from "../DataInput.vue"
import DocumentPath from "../../document/DocumentPath.vue"
import { SharedDataInputProps } from "../DataInputTypes"

interface ObjType {
	[prop: string]: any
}

const props = defineProps<
	{
		schema: SchemaObj
		modelValue: ObjType | undefined
	} & SharedDataInputProps
>()

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

function onMouseDown(ev: MouseEvent) {
	ev.stopPropagation()
}
</script>

<style scoped>
.data-input {
	padding: 0.5rem;
	margin: 0.5rem;
	border: solid 1px var(--surface-border);
	border-radius: var(--border-radius);
}

.data-input:focus {
	border: solid 1px #c9b1cb;
	box-shadow: 0 0 0 1px #e9aaff;
}

.data-input :deep(.data-prop) {
	margin-top: 1.5rem;
}
</style>
