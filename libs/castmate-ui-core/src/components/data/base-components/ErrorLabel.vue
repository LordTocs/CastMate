<template>
	<small class="p-error" id="text-error">{{ errorMessage || "&nbsp;" }}</small>
</template>

<script setup lang="ts">
const props = defineProps<{
	errorMessage?: string
}>()
</script>
