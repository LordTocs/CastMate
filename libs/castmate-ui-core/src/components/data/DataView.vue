<template>
	<component v-if="viewComponent" :is="viewComponent" :modelValue="modelObj" :schema="schema" :context="context" />
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { useDataViewComponent } from "../../util/data"
import { Schema } from "castmate-schema"
import { SharedDataViewProps } from "./DataInputTypes"

const props = defineProps<
	{
		modelValue: any
		schema: Schema
	} & SharedDataViewProps
>()

const emit = defineEmits(["update:modelValue"])

const modelObj = useVModel(props, "modelValue", emit)

const viewComponent = useDataViewComponent(() => props.schema.type)
</script>
