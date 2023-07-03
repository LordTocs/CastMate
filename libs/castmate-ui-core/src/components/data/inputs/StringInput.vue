<template>
	<div class="p-inputgroup w-full">
		<span class="p-float-label">
			<p-input-text id="l" v-model="model" />
			<label for="l"> {{ props.schema.name }}</label>
		</span>
		<span v-if="schema.template" class="p-inputgroup-addon">
			<i class="mdi mdi-code-braces" />
		</span>
		<p-button v-if="!schema.required" icon="pi pi-times" @click="clear" />
	</div>
</template>

<script setup lang="ts">
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import { type SchemaString, type SchemaBase } from "castmate-schema"
import { useVModel } from "@vueuse/core"

const props = defineProps<{
	schema: SchemaString & SchemaBase
	modelValue: string | undefined
}>()

const emit = defineEmits(["update:modelValue"])

function clear() {
	model.value = undefined
}

const model = useVModel(props, "modelValue", emit)
</script>
