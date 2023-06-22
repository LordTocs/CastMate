<template>
	<h1>Blah {{ modelValue?.name }}</h1>
</template>

<script setup lang="ts">
const props = defineProps<{
	modelValue: {
		name?: string
	}
}>()
</script>
