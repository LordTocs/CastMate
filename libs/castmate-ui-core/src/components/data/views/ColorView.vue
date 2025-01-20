<template>
	<span class="data-label" v-if="schema.name && !noLabel">{{ schema.name }}:</span>
	<div class="color-view-splotch" :style="{ backgroundColor: props.modelValue }"></div>
</template>

<script setup lang="ts">
import { SchemaColor } from "castmate-schema"
import { Color } from "castmate-schema"
import { SharedDataViewProps } from "../DataInputTypes"

const props = defineProps<
	{
		modelValue: Color
		schema: SchemaColor
	} & SharedDataViewProps
>()
</script>

<style scoped>
.color-view-splotch {
	border-radius: var(--border-radius);
	display: inline-block;
	height: 1em;
	width: 2rem;
}
</style>
