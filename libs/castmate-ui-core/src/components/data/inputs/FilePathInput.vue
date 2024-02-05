<template>
	<div class="p-inputgroup" @mousedown="stopPropagation">
		<document-path :local-path="localPath">
			<label-floater :label="schema.name" :no-float="noFloat" input-id="directory" v-slot="labelProps">
				<template-toggle
					v-model="model"
					:template-mode="templateMode"
					v-bind="labelProps"
					v-slot="templateProps"
					:error-message="errorMessage"
				>
					<input-box :model="model" v-bind="templateProps" @click="dirClick" />
				</template-toggle>
			</label-floater>
			<p-button
				class="flex-none no-focus-highlight"
				v-if="schema.template"
				icon="mdi mdi-code-braces"
				@click="toggleTemplate"
			/>
			<p-button class="flex-none no-focus-highlight" v-if="!schema.required" icon="pi pi-times" @click="clear" />
		</document-path>
	</div>
</template>

<script setup lang="ts">
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

const errorMessage = useValidator(model, () => props.schema)

const getFileInput = useIpcCaller<(existing: string | undefined, exts: string[] | undefined) => string | undefined>(
	"filesystem",
	"getFileInput"
)

const templateMode = ref(false)
function toggleTemplate() {
	if (!props.schema.template) {
		return
	}

	templateMode.value = !templateMode.value
}

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
