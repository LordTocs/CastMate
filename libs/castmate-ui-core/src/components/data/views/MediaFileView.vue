<template>
	<span class="data-label" v-if="schema.name">{{ schema.name }}:</span> {{ modelValue }}
</template>

<script setup lang="ts">
import { SchemaMediaFile } from "castmate-schema"
import { MediaFile } from "castmate-schema"
import { SharedDataViewProps } from "../DataInputTypes"

const props = defineProps<
	{
		modelValue: MediaFile
		schema: SchemaMediaFile
	} & SharedDataViewProps
>()
</script>
