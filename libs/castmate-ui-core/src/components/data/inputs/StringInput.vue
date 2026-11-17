<template>
	<data-input-base
		v-model="model"
		:schema="schema"
		:no-float="noFloat"
		:toggle-template="toggleTemplate"
		v-slot="inputProps"
		ref="dataInputBase"
		:local-path="localPath"
	>
		<p-password v-model="model" v-if="isSecret" toggle-mask :feedback="false" ref="inputPassword" />
		<enum-input :schema="schema" v-model="model" :context="context" v-else-if="schema.enum" ref="enumInput" />
		<p-text-area
			v-model="model"
			:rows="!props.schema.multiLine ? 1 : undefined"
			v-else
			autoResize
			fluid
			ref="textArea"
		/>
		<!-- <p-input-text v-model="model" v-bind="templateProps" v-else ref="inputText" /> -->
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"
import PPassword from "primevue/password"
import { type SchemaString, type SchemaBase } from "castmate-schema"
import { SharedDataInputProps, defaultStringIsTemplate } from "../DataInputTypes"
import { useFocusWatcher, useTextSelectionWatcher, useTextUndoCommitter } from "../../../main"
import EnumInput from "../base-components/EnumInput.vue"
import { computed, onMounted, ref, useModel } from "vue"
import PTextArea from "primevue/textarea"
import { useDataBinding, useDataUIBinding } from "../../../editor/data-binding.ts"
import { useEventListener } from "@vueuse/core"

const props = defineProps<
	{
		schema: SchemaString
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = defineModel<string>()

const isSecret = computed(() => props.secret || props.schema.secret)

const toggleTemplate = computed(() => {
	return props.schema.enum != null || props.secret
})

const inputPassword = ref<InstanceType<typeof PPassword> & { $el: HTMLInputElement }>()
const textArea = ref<InstanceType<typeof PTextArea> & { $el: HTMLInputElement }>()
// const inputText = ref<InstanceType<typeof PInputText> & { $el: HTMLElement }>()

useEventListener(
	() => (!props.schema.multiLine ? textArea.value?.$el : undefined),
	"beforeinput",
	(ev) => {
		if (ev.inputType == "insertLineBreak") {
			ev.preventDefault()
		}
	}
)

const inputElem = computed(() => inputPassword.value?.$el ?? textArea.value?.$el)

useTextUndoCommitter(inputElem)
useFocusWatcher(inputElem)
useTextSelectionWatcher(inputElem)

function focus() {
	inputElem.value?.focus()
	// inputText.value?.$el.focus()
}

defineExpose({
	focus,
})

useDataUIBinding({
	focus,
	scrollIntoView() {
		inputPassword.value?.$el.scrollIntoView()
		textArea.value?.$el.scrollIntoView()
		// inputText.value?.$el.scrollIntoView()
	},
})
</script>
