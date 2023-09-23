<template>
	<component
		v-if="inputComponent"
		:is="inputComponent"
		v-model="modelObj"
		:schema="schema"
		:local-path="localPath"
		:no-float="noFloat"
	/>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { useDataComponent } from "../../util/data"
import { Schema } from "castmate-schema"
import { SharedDataInputProps } from "./DataInputTypes"

const props = defineProps<
	{
		modelValue: any
		schema: Schema
	} & SharedDataInputProps
>()

const emit = defineEmits(["update:modelValue"])

const modelObj = useVModel(props, "modelValue", emit)

const inputComponent = useDataComponent(() => props.schema.type)
</script>
