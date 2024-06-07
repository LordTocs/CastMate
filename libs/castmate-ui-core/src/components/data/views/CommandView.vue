<template>
	<span class="data-label" v-if="schema.name">{{ schema.name }}: </span>
	<span> {{ getCommandInfoString(props.modelValue) }}</span>
</template>

<script setup lang="ts">
import { SchemaCommand } from "castmate-schema"
import { SharedDataViewProps } from "../DataInputTypes"
import { Command, getCommandInfoString } from "castmate-schema"

const props = defineProps<
	{
		modelValue: Command | undefined
		schema: SchemaCommand
	} & SharedDataViewProps
>()
</script>
