<template>
	<p>
		<span class="text--secondary" v-if="schema.name || label">
			{{ schema.name || label }}: </span
		>{{ modelValue.min != null ? modelValue.min : `-∞` }} ⟶
		{{ modelValue.max != null ? modelValue.max : `∞` }}
	</p>
</template>

<script setup>
const props = defineProps({
	modelValue: {},
	schema: {},
	label: { type: String },
})
</script>
