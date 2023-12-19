import { defineStore } from "pinia"
import { ComputedRef, MaybeRefOrGetter, computed, ref, toValue } from "vue"
import PContextMenu from "primevue/contextmenu"

export const useContextMenu = defineStore("context-menu", () => {
	const menuComponent = ref<InstanceType<typeof PContextMenu>>()

	function onOpen(menu: InstanceType<typeof PContextMenu>) {
		if (menuComponent.value) {
			menuComponent.value.hide()
		}
		menuComponent.value = menu
	}

	function onClose(menu: InstanceType<typeof PContextMenu>) {
		if (menuComponent.value == menu) {
			menuComponent.value = undefined
		}
	}

	return {
		onOpen,
		onClose,
	}
})
