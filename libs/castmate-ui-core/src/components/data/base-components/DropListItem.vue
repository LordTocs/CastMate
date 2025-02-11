<template>
	<li
		class="p-select-option autocomplete-item"
		:class="{ 'p-focus': focused, 'p-highlight': highlighted }"
		:data-p-highlight="highlighted"
		:data-p-focused="focused"
		:aria-label="label"
		:aria-selected="highlighted"
		@click="emit('click', $event)"
		ref="li"
	>
		<slot> {{ label }}</slot>
	</li>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue"

const props = defineProps<{
	focused?: boolean
	highlighted?: boolean
	label?: string
}>()

const emit = defineEmits(["click"])

const li = ref<HTMLElement>()

onMounted(() => {
	watch(
		() => props.focused,
		() => {
			if (props.focused) {
				li.value?.scrollIntoView({ block: "nearest" })
			}
		}
	)
})
</script>

<style scoped>
.autocomplete-item {
	width: 100%;
	overflow-x: hidden;
}
</style>
