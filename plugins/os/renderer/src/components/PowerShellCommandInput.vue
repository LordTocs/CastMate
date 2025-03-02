<template>
	<data-input-base v-model="model" :schema="schema" :toggle-template="false" v-slot="inputProps">
		<template-toggle
			v-model="model"
			:template-mode="schema.template ?? false"
			v-bind="inputProps"
			v-slot="templateProps"
		>
			<p-input-text v-model="model" v-bind="templateProps" ref="inputText" />
		</template-toggle>
	</data-input-base>
</template>

<script setup lang="ts">
import { PowerShellCommand, SchemaPowerShellCommand } from "castmate-plugin-os-shared"
import { SharedDataInputProps, TemplateToggle, DataInputBase, useDataBinding, useDataUIBinding } from "castmate-ui-core"
import { ref, useModel } from "vue"
import PButton from "primevue/button"
import PInputText from "primevue/inputtext"

const props = defineProps<
	{
		modelValue: PowerShellCommand | undefined
		schema: SchemaPowerShellCommand
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

const inputText = ref<InstanceType<typeof PInputText> & { $el: HTMLElement }>()

useDataUIBinding({
	focus() {
		inputText.value?.$el.focus()
	},
	scrollIntoView() {
		inputText.value?.$el.scrollIntoView()
	},
})
</script>
