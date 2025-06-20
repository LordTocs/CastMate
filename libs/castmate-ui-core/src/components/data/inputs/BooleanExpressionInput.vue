<template>
	<div class="boolean-expression-input" tabindex="-1">
		<span class="text-color-secondary text-sm">{{ getDataLabel(props) }}</span>
		<boolean-group-expression v-model="model" :show-drag="false" :selected-ids="[]" />
	</div>
</template>

<script setup lang="ts">
import { BooleanExpression, SchemaBooleanExpression } from "castmate-schema"
import { ref, useModel } from "vue"
import BooleanGroupExpression from "../base-components/booleans/BooleanGroupExpression.vue"
import { getDataLabel, SharedDataInputProps, useDataBinding } from "../../../main"
const props = defineProps<
	{
		modelValue: BooleanExpression | undefined
		localPath?: string
		schema: SchemaBooleanExpression
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")
</script>

<style scoped>
.boolean-expression-input {
	padding: 0.5rem;
	margin: 0.5rem;
	border-radius: var(--border-radius);
	border: solid 1px var(--surface-border);
}

.boolean-expression-input:focus {
	border: solid 1px #c9b1cb;
	box-shadow: 0 0 0 1px #e9aaff;
}
</style>
