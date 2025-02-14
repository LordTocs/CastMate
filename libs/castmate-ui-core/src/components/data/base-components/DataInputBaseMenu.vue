<template>
	<p-button
		v-if="hasMenu"
		class="ml-1 flex-shrink-0"
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
import { usePropagationStop, useUndoCommitter } from "../../../main"

const model = defineModel<any>()
const templateMode = defineModel<boolean>("templateMode", { default: false })

const props = defineProps<{
	canClear: boolean
	canTemplate: boolean
	disabled?: boolean
	menuExtra?: MenuItem[]
}>()

const menu = ref<InstanceType<typeof PMenu>>()
const contextMenu = ref<InstanceType<typeof CContextMenu>>()

const undoModel = useUndoCommitter(model)

function clear() {
	undoModel.value = undefined
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
