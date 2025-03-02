<template>
	<span class="data-label" v-if="schema.name && !noLabel">{{ schema.name }}: </span>{{ modelValue }}
</template>

<script setup lang="ts">
import { SchemaBase } from "castmate-schema"
import { SharedDataViewProps } from "../../../main"

const props = defineProps<
	{
		modelValue: any
		schema: SchemaBase
	} & SharedDataViewProps
>()
</script>
