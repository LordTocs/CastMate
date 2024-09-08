<template>
	<span @contextmenu="contextMenu?.show($event)">{{ variable.name }}</span>
	<c-context-menu ref="contextMenu" :items="menuItems" />
</template>

<script setup lang="ts">
import { ViewerVariable } from "castmate-schema"
import { CContextMenu, useViewerDataStore } from "castmate-ui-core"
import { MenuItem } from "primevue/menuitem"
import { useConfirm } from "primevue/useconfirm"
import { computed, ref } from "vue"

const props = defineProps<{
	variable: ViewerVariable
}>()

const viewerDataStore = useViewerDataStore()

const confirm = useConfirm()
const contextMenu = ref<InstanceType<typeof CContextMenu>>()
const menuItems = computed<MenuItem[]>(() => {
	let result: MenuItem[] = []

	result.push({
		label: "Delete",
		icon: "mdi mdi-delete",
		command(ev) {
			confirm.require({
				header: `Delete ${props.variable.name}?`,
				message: `Are you sure you want to delete ${props.variable.name}? THIS WILL ERASE ALL OF THE DATA FOR THIS COLUMN.`,
				icon: "mdi mdi-trash",
				accept() {
					//props.item.delete?.()
					viewerDataStore.deleteViewerVariable(props.variable.name)
				},
				reject() {},
			})
		},
	})

	return result
})
</script>
