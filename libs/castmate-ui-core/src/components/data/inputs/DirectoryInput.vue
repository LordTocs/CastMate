<template>
	<data-input-base v-model="model" :schema="schema" v-slot="inputProps">
		<input-box :model="model" v-bind="inputProps" @click="dirClick" class="clickable-input" />
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"
import { Directory, SchemaDirectory } from "castmate-schema"
import { SharedDataInputProps } from "../DataInputTypes"
import { InputBox, useIpcCaller } from "../../../main"
import { useModel } from "vue"
import { useValidator } from "../../../util/validation"

const props = defineProps<
	{
		modelValue: Directory | undefined
		schema: SchemaDirectory
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

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
</script>
