<template>
	<span class="data-label">{{ schema.name }}:</span> {{ minString }} ⟶ {{ maxString }}
</template>

<script setup lang="ts">
import { Range } from "castmate-schema"
import { SchemaRange } from "castmate-schema"
import { computed } from "vue"
import { SharedDataViewProps } from "../DataInputTypes"

const props = defineProps<
	{
		modelValue: Range | undefined
		schema: SchemaRange
	} & SharedDataViewProps
>()

const minString = computed(() => {
	if (!props.modelValue || props.modelValue.min == null) return "-∞"
	return props.modelValue.min
})

const maxString = computed(() => {
	if (!props.modelValue || props.modelValue.max == null) return "∞"
	return props.modelValue.max
})
</script>

<style scoped></style>
