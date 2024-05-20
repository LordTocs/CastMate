<template>
	<p-button
		v-if="hasMenu"
		class="ml-1"
		text
		icon="mdi mdi-dots-vertical"
		aria-controls="input_menu"
		@click="menu?.toggle($event)"
		:disabled="disabled"
	></p-button>
	<p-menu ref="menu" id="input_menu" :model="menuItems" :popup="true" v-if="hasMenu" />
	<c-context-menu ref="contextMenu" :items="menuItems" v-if="hasMenu" />
</template>

<script setup lang="ts">
import CContextMenu from "../../util/CContextMenu.vue"
import PButton from "primevue/button"
import PMenu from "primevue/menu"
import type { MenuItem } from "primevue/menuitem"
import { computed, ref, useModel } from "vue"
import { usePropagationStop } from "../../../main"

const props = defineProps<{
	modelValue: any
	templateMode: boolean
	canClear: boolean
	canTemplate: boolean
	disabled?: boolean
	menuExtra?: MenuItem[]
}>()

const menu = ref<PMenu>()
const contextMenu = ref<InstanceType<typeof CContextMenu>>()

const model = useModel(props, "modelValue")

const templateMode = useModel(props, "templateMode")

function clear() {
	model.value = undefined
}

const menuItems = computed<MenuItem[]>(() => {
	let result: MenuItem[] = []

	if (props.menuExtra) {
		result.push(...props.menuExtra)
	}

	if (props.canTemplate) {
		if (templateMode.value) {
			result.push({
				label: "Disable Templating",
				command(event) {
					templateMode.value = false
				},
			})
		} else {
			result.push({
				label: "Enabling Templating",
				command(event) {
					templateMode.value = true
				},
			})
		}
	}

	if (props.canClear) {
		result.push({
			label: "Clear",
			command(event) {
				clear()
			},
		})
	}

	return result
})

const hasMenu = computed(() => {
	return menuItems.value.length > 0
})

const stopPropagation = usePropagationStop()

defineExpose({
	openContext(ev: Event) {
		if (hasMenu.value) {
			contextMenu.value?.show(ev)
			stopPropagation(ev)
			ev.preventDefault()
		}
	},
})
</script>
