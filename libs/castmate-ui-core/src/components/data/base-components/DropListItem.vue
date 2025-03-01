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
import { onBeforeMount, onMounted, ref, watch } from "vue"
import { Theme } from "@primeuix/styled"
import { BaseStyle } from "@primevue/core"
import SelectStyle from "primevue/select/style"

const props = defineProps<{
	focused?: boolean
	highlighted?: boolean
	label?: string
}>()

const emit = defineEmits(["click"])

const li = ref<HTMLElement>()

onBeforeMount(() => {
	//@ts-ignore
	const selectStyle: BaseStyle = SelectStyle

	if (selectStyle.name && !Theme.isStyleNameLoaded(selectStyle.name)) {
		//@ts-ignore
		const { css, style } = selectStyle.getComponentTheme?.() || {}

		selectStyle.load?.(css, { name: `${selectStyle.name}-variables` })
		//@ts-ignore
		selectStyle.loadStyle?.({ name: `${selectStyle.name}-style` }, style)

		Theme.setLoadedStyleName(selectStyle.name)
	} else {
		//@ts-ignore
		console.log("LOADED??? ", SelectStyle?.name)
	}
})

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
