<template>
	<data-input-base v-model="model" :schema="schema" v-slot="inputProps">
		<input-box :model="model" v-bind="inputProps" @click="dirClick" class="clickable-input" ref="inputBoxRef" />
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"
import { Directory, SchemaDirectory } from "castmate-schema"
import { SharedDataInputProps } from "../DataInputTypes"
import { InputBox, useIpcCaller, usePropagationStop } from "../../../main"
import { ref, useModel } from "vue"
import { useValidator } from "../../../util/validation"
import { useDataBinding, useDataUIBinding, useUndoCommitter } from "../../../util/data-binding"

const props = defineProps<
	{
		modelValue: Directory | undefined
		schema: SchemaDirectory
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")
const undoModel = useUndoCommitter(model)

const getFolderInput = useIpcCaller<(existing: string | undefined) => string | undefined>(
	"filesystem",
	"getFolderInput"
)

const stopPropagation = usePropagationStop()

async function dirClick(ev: MouseEvent) {
	if (ev.button != 0) return

	stopPropagation(ev)
	ev.preventDefault()

	const folder = await getFolderInput(model.value)
	if (folder != null) {
		undoModel.value = folder
	}
}

const inputBoxRef = ref<InstanceType<typeof InputBox>>()

useDataUIBinding({
	focus() {
		inputBoxRef.value?.focus()
	},
	scrollIntoView() {
		inputBoxRef.value?.scrollIntoView()
	},
})
</script>
