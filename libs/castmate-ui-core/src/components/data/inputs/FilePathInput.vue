<template>
	<data-input-base v-model="model" :schema="schema" v-slot="inputProps">
		<input-box :model="model" v-bind="inputProps" @click="dirClick" class="clickable-input" />
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"
import { FilePath, SchemaFilePath } from "castmate-schema"
import { SharedDataInputProps } from "../DataInputTypes"
import { DocumentPath, InputBox, LabelFloater, stopPropagation, useIpcCaller } from "../../../main"
import TemplateToggle from "../base-components/TemplateToggle.vue"
import { ref, useModel } from "vue"
import { useValidator } from "../../../util/validation"
import PButton from "primevue/button"

const props = defineProps<
	{
		modelValue: FilePath | undefined
		schema: SchemaFilePath
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const getFileInput = useIpcCaller<(existing: string | undefined, exts: string[] | undefined) => string | undefined>(
	"filesystem",
	"getFileInput"
)

async function dirClick(ev: MouseEvent) {
	if (ev.button != 0) return

	ev.stopPropagation()
	ev.preventDefault()

	const file = await getFileInput(model.value, props.schema.extensions)
	if (file != null) {
		model.value = file
	}
}

function clear() {
	model.value = undefined
}
</script>
