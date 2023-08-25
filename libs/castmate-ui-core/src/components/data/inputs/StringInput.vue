<template>
	<div class="p-inputgroup w-full" @mousedown="onMousedown">
		<span class="p-float-label">
			<document-path :local-path="localPath">
				<p-input-text id="l" v-model="model" />
			</document-path>
			<label for="l"> {{ props.schema.name }}</label>
		</span>
		<span v-if="schema.template" class="p-inputgroup-addon" style="width: 2.857rem">
			<i class="mdi mdi-code-braces flex-none" />
		</span>
		<p-button class="flex-none" v-if="!schema.required" icon="pi pi-times" @click.stop="clear" />
	</div>
</template>

<script setup lang="ts">
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import { type SchemaString, type SchemaBase } from "castmate-schema"
import { useVModel } from "@vueuse/core"
import DocumentPath from "../../document/DocumentPath.vue"

const props = defineProps<{
	schema: SchemaString & SchemaBase
	modelValue: string | undefined
	localPath?: string
}>()

const emit = defineEmits(["update:modelValue"])

function clear() {
	model.value = undefined
}

const model = useVModel(props, "modelValue", emit)

function onMousedown(ev: MouseEvent) {
	ev.stopPropagation() //Stop propagating so we don't get selection
}
</script>
