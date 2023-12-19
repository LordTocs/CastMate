<template>
	<div class="p-inputgroup" @mousedown="stopPropagation">
		<document-path :local-path="localPath">
			<label-floater :label="schema.name" :no-float="noFloat" input-id="directory" v-slot="labelProps">
				<template-toggle
					v-model="model"
					:template-mode="false"
					v-bind="labelProps"
					v-slot="templateProps"
					:error-message="errorMessage"
				>
					<input-box :model="model" v-bind="templateProps" @click="dirClick" />
				</template-toggle>
			</label-floater>
			<p-button class="flex-none no-focus-highlight" v-if="!schema.required" icon="pi pi-times" @click="clear" />
		</document-path>
	</div>
</template>

<script setup lang="ts">
import { Directory, SchemaDirectory } from "castmate-schema"
import { SharedDataInputProps } from "../DataInputTypes"
import { DocumentPath, InputBox, LabelFloater, stopPropagation, useIpcCaller } from "../../../main"
import TemplateToggle from "../base-components/TemplateToggle.vue"
import { useModel } from "vue"
import { useValidator } from "../../../util/validation"
import PButton from "primevue/button"

const props = defineProps<
	{
		modelValue: Directory | undefined
		schema: SchemaDirectory
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const errorMessage = useValidator(model, () => props.schema)

const getFolderInput = useIpcCaller<(existing: string | undefined) => string | undefined>(
	"filesystem",
	"getFolderInput"
)

async function dirClick(ev: MouseEvent) {
	if (ev.button != 0) return

	ev.stopPropagation()
	ev.preventDefault()

	const folder = await getFolderInput(model.value)
	if (folder != null) {
		model.value = folder
	}
}

function clear() {
	model.value = undefined
}
</script>
