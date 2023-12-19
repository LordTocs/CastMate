<template ref>
	<p-context-menu ref="menu" :model="items" />
</template>

<script setup lang="ts">
import PContextMenu from "primevue/contextmenu"
import { MenuItem } from "primevue/menuitem"
import { onBeforeUnmount, ref } from "vue"
import { useContextMenu } from "../../util/context-store"

const menu = ref<InstanceType<typeof PContextMenu>>()

const props = defineProps<{
	items: MenuItem[] | undefined
}>()

const contextStore = useContextMenu()

defineExpose({
	show(event: Event) {
		if (!menu.value) return

		contextStore.onOpen(menu.value)
		menu.value.show(event)
	},
	hide() {
		if (!menu.value) return

		contextStore.onClose(menu.value)
		return menu.value?.hide()
	},
})

onBeforeUnmount(() => {
	if (!menu.value) return
	contextStore.onClose(menu.value)
})
</script>
