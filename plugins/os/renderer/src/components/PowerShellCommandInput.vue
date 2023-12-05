<template>
	<div class="p-inputgroup" @mousedown="stopPropagation">
		<document-path :local-path="localPath">
			<label-floater :label="schema.name" :no-float="noFloat" input-id="text" v-slot="labelProps">
				<template-toggle
					v-model="model"
					:template-mode="schema.template ?? false"
					v-bind="labelProps"
					v-slot="templateProps"
				>
					<p-input-text v-model="model" v-bind="templateProps" />
				</template-toggle>
			</label-floater>
		</document-path>
		<p-button class="flex-none" v-if="!schema.required" icon="pi pi-times" @click.stop="clear" />
	</div>
</template>

<script setup lang="ts">
import { PowerShellCommand, SchemaPowerShellCommand } from "castmate-plugin-os-shared"
import { SharedDataInputProps, stopPropagation, DocumentPath, LabelFloater, TemplateToggle } from "castmate-ui-core"
import { useModel } from "vue"
import PButton from "primevue/button"
import PInputText from "primevue/inputtext"

const props = defineProps<
	{
		modelValue: PowerShellCommand | undefined
		schema: SchemaPowerShellCommand
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

function clear() {
	model.value = undefined
}
</script>
