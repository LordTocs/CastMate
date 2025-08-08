<template>
	<component
		v-if="inputComponent"
		:is="inputComponent"
		v-model="model"
		:schema="schema"
		:local-path="localPath"
		:no-float="noFloat"
		:context="context"
		:secret="secret"
		:disabled="disabled"
		ref="inputElem"
	/>
</template>

<script setup lang="ts">
import { useDataComponent } from "../../util/data"
import { Schema } from "castmate-schema"
import { SharedDataInputProps } from "./DataInputTypes"
import { ref, useModel } from "vue"

const props = defineProps<
	{
		modelValue: any
		schema: Schema
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const inputComponent = useDataComponent(() => props.schema.type)

const inputElem = ref<{ focus?: () => any }>()
defineExpose({
	focus() {
		inputElem.value?.focus?.()
	},
})
</script>
