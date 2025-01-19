<template>
	<data-input-base v-model="model" :schema="schema" v-slot="inputProps" ref="inputBase">
		<input-box :model="model" v-bind="inputProps" @click="dirClick" class="clickable-input" ref="inputBox" />
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"
import { FilePath, SchemaFilePath } from "castmate-schema"
import { SharedDataInputProps } from "../DataInputTypes"
import { InputBox, LabelFloater, useIpcCaller, usePropagationStop } from "../../../main"
import TemplateToggle from "../base-components/TemplateToggle.vue"
import { ref, useModel } from "vue"
import { useValidator } from "../../../util/validation"
import PButton from "primevue/button"
import { useDataBinding, useDataUIBinding } from "../../../util/data-binding"

const props = defineProps<
	{
		modelValue: FilePath | undefined
		schema: SchemaFilePath
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

const getFileInput = useIpcCaller<(existing: string | undefined, exts: string[] | undefined) => string | undefined>(
	"filesystem",
	"getFileInput"
)

const stopPropagation = usePropagationStop()

async function dirClick(ev: MouseEvent) {
	if (ev.button != 0) return

	stopPropagation(ev)
	ev.preventDefault()

	const file = await getFileInput(model.value, props.schema.extensions)
	if (file != null) {
		model.value = file
	}
}

const inputBase = ref<InstanceType<typeof DataInputBase>>()
const inputBox = ref<InstanceType<typeof InputBox>>()

useDataUIBinding({
	focus() {
		inputBox.value?.inputDiv?.focus()
	},
	scrollIntoView() {
		inputBox.value?.inputDiv?.scrollIntoView()
	},
})
</script>
