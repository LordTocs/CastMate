<template>
	<component v-if="inputComponent" :is="inputComponent" v-model="modelObj" :schema="schema" :local-path="localPath" />
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { useDataComponent } from "../../util/data"
import { Schema } from "castmate-schema"

const props = defineProps<{
	modelValue: any
	schema: Schema
	context?: any
	localPath?: string
}>()

const emit = defineEmits(["update:modelValue"])

const modelObj = useVModel(props, "modelValue", emit)

const inputComponent = useDataComponent(() => props.schema.type)
</script>
