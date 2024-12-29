<template>
	<li
		class="p-select-option autocomplete-item"
		:class="{ 'p-focus': focused, 'p-highlight': highlighted }"
		:data-p-highlight="highlighted"
		:data-p-focused="focused"
		:aria-label="label"
		:aria-selected="highlighted"
		@click="emit('click', $event)"
	>
		<slot> {{ label }}</slot>
	</li>
</template>

<script setup lang="ts">
const props = defineProps<{
	focused?: boolean
	highlighted?: boolean
	label?: string
}>()

const emit = defineEmits(["click"])
</script>

<style scoped>
.autocomplete-item {
	width: 100%;
	overflow-x: hidden;
}
</style>
