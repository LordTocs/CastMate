<template>
	<div class="data-transform-group">
		<div class="data-group-header">
			{{ label }}
		</div>
		<div :class="innerClass">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">
import { StyleValue } from "vue"

const props = defineProps<{
	label?: string
	modelValue: object | undefined
	innerClass?: any
}>()
</script>

<style scoped>
.data-transform-group {
	padding: 0.5rem;
	margin-top: 1.5rem;
	border: solid 1px var(--surface-100);
	border-radius: var(--border-radius);
}
</style>
