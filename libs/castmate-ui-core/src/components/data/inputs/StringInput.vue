<template>
	<data-input-base
		v-model="model"
		:schema="schema"
		:no-float="noFloat"
		:toggle-template="toggleTemplate"
		v-slot="inputProps"
		ref="dataInputBase"
	>
		<template-toggle
			v-model="model"
			:template-mode="!!schema.template && !toggleTemplate"
			v-bind="inputProps"
			v-slot="templateProps"
			:multi-line="schema.multiLine"
		>
			<p-password
				v-model="model"
				v-bind="templateProps"
				v-if="isSecret"
				toggle-mask
				:feedback="false"
				ref="inputPassword"
			/>
			<enum-input
				:schema="schema"
				v-model="model"
				:context="context"
				v-bind="templateProps"
				v-else-if="schema.enum"
				ref="enumInput"
			/>
			<p-text-area
				v-model="model"
				v-bind="templateProps"
				v-else-if="schema.multiLine"
				autoResize
				ref="textArea"
			/>
			<p-input-text v-model="model" v-bind="templateProps" v-else ref="inputText" />
		</template-toggle>
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"
import PInputText from "primevue/inputtext"
import PPassword from "primevue/password"
import { type SchemaString, type SchemaBase } from "castmate-schema"
import { SharedDataInputProps, defaultStringIsTemplate } from "../DataInputTypes"
import { TemplateToggle } from "../../../main"
import EnumInput from "../base-components/EnumInput.vue"
import { computed, onMounted, ref, useModel } from "vue"
import PTextArea from "primevue/textarea"
import { useDataBinding, useDataUIBinding } from "../../../util/data-binding"

const props = defineProps<
	{
		schema: SchemaString
		modelValue: string | undefined
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

const isSecret = computed(() => props.secret || props.schema.secret)

const toggleTemplate = computed(() => {
	return props.schema.enum != null || props.secret
})

const inputPassword = ref<InstanceType<typeof PPassword> & { $el: HTMLElement }>()
const textArea = ref<InstanceType<typeof PTextArea> & { $el: HTMLElement }>()
const inputText = ref<InstanceType<typeof PInputText> & { $el: HTMLElement }>()

useDataUIBinding({
	focus() {
		inputPassword.value?.$el.focus()
		textArea.value?.$el.focus()
		inputText.value?.$el.focus()
	},
	scrollIntoView() {
		inputPassword.value?.$el.scrollIntoView()
		textArea.value?.$el.scrollIntoView()
		inputText.value?.$el.scrollIntoView()
	},
})
</script>
