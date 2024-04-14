<template>
	<data-input-base v-model="model" :schema="schema" :toggle-template="false" v-slot="inputProps">
		<template-toggle
			v-model="model"
			:template-mode="schema.template ?? false"
			v-bind="inputProps"
			v-slot="templateProps"
		>
			<p-input-text v-model="model" v-bind="templateProps" />
		</template-toggle>
	</data-input-base>
</template>

<script setup lang="ts">
import { PowerShellCommand, SchemaPowerShellCommand } from "castmate-plugin-os-shared"
import { SharedDataInputProps, TemplateToggle, DataInputBase } from "castmate-ui-core"
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
</script>
