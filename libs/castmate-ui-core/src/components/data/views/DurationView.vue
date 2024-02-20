<template>
	<span class="data-label" v-if="schema.name">{{ schema.name }}: </span>
	<duration-label :model-value="props.modelValue" />
</template>

<script setup lang="ts">
import { SchemaDuration } from "castmate-schema"
import { Duration } from "castmate-schema"
import { SharedDataViewProps } from "../DataInputTypes"
import DurationLabel from "../base-components/DurationLabel.vue"
const props = defineProps<
	{
		modelValue: Duration
		schema: SchemaDuration
	} & SharedDataViewProps
>()
</script>
