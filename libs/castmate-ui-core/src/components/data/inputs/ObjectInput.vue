<template>
	<document-path :local-path="localPath">
		<div
			class="data-input"
			:class="{ 'data-input-outline': showLabel }"
			tabindex="-1"
			v-bind="$attrs"
			@mousedown="onMouseDown"
			v-if="propKeys.length > 0"
		>
			<div v-if="showLabel" class="flex flex-row">
				<span class="text-color-secondary text-sm">{{ schema.name }}</span>
				<div class="flex-grow-1"></div>
			</div>
			<data-input
				class="data-prop"
				v-for="(prop, i) in propKeys"
				:key="prop"
				:model-value="getModelProp(prop)"
				@update:model-value="setModelProp(prop, $event)"
				:schema="schema.properties[prop]"
				:local-path="prop"
				:context="context"
				:secret="secret"
				:disabled="disabled"
			/>
		</div>
	</document-path>
</template>

<script setup lang="ts">
import { type SchemaObj } from "castmate-schema"
import DataInput from "../DataInput.vue"
import DocumentPath from "../../document/DocumentPath.vue"
import { SharedDataInputProps } from "../DataInputTypes"
import { computed } from "vue"
import { usePropagationStop } from "../../../main"

interface ObjType {
	[prop: string]: any
}

const props = defineProps<
	{
		schema: SchemaObj
		modelValue: ObjType | undefined
	} & SharedDataInputProps
>()

const propKeys = computed(() => Object.keys(props.schema.properties))

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

const stopPropagation = usePropagationStop()

function onMouseDown(ev: MouseEvent) {
	stopPropagation(ev)
}

const showLabel = computed(() => props.schema.name != null)
</script>

<style scoped>
.data-input-outline {
	padding: 0.5rem;
	margin: 0.5rem;
	border: solid 1px var(--surface-border);
	border-radius: var(--border-radius);
}

.data-input-outline:focus {
	border: solid 1px #c9b1cb;
	box-shadow: 0 0 0 1px #e9aaff;
}

.data-input :deep(.data-prop) {
	margin-top: 1.5rem;
}
</style>
