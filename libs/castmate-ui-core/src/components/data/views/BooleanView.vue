<template>
	<span class="data-label" v-if="schema.name">{{ schema.name }}:</span>
	<i :class="props.modelValue ? schema.trueIcon ?? 'pi pi-check' : schema.falseIcon ?? 'pi pi-times'" />
</template>

<script setup lang="ts">
import { SchemaBoolean } from "castmate-schema"
import { SharedDataViewProps } from "../DataInputTypes"

const props = defineProps<
	{
		modelValue: boolean | undefined
		schema: SchemaBoolean
	} & SharedDataViewProps
>()
</script>
