<template>
	<div class="widget-list-item gap-1" :class="{ selected }" :key="model.id" @click="onClick" @contextmenu="onContext">
		<span class="flex-grow-1">{{ model.name }}</span>
		<p-toggle-button
			on-icon="mdi mdi-eye-outline"
			on-label=""
			off-icon="mdi mdi-eye-off-outline"
			off-label=""
			size="small"
			text
			class="extra-small-button"
			v-model="model.visible"
		/>
		<p-toggle-button
			on-icon="mdi mdi-lock-outline"
			on-label=""
			off-icon="mdi mdi-lock-open-outline"
			off-label=""
			size="small"
			text
			class="extra-small-button"
			v-model="model.locked"
		/>
		<c-context-menu ref="contextMenu" :items="contextItems" />
	</div>
</template>

<script setup lang="ts">
import { OverlayWidgetConfig } from "castmate-plugin-overlays-shared"
import type { MenuItem } from "primevue/menuitem"
import PToggleButton from "primevue/togglebutton"
import { computed, ref, useModel } from "vue"
import { CContextMenu, NameDialog } from "castmate-ui-core"

import { useDialog } from "primevue/usedialog"
import { useConfirm } from "primevue/useconfirm"

const props = defineProps<{
	modelValue: OverlayWidgetConfig
	selected: boolean
}>()

const contextMenu = ref<InstanceType<typeof CContextMenu>>()

const model = useModel(props, "modelValue")

const emit = defineEmits(["click", "delete"])

const dialog = useDialog()

const contextItems = computed<MenuItem[]>(() => {
	return [
		{
			label: "Rename",
			icon: "mdi mdi-rename",
			command(event) {
				dialog.open(NameDialog, {
					props: {
						header: `Rename ${model.value.name}?`,
						style: {
							width: "25vw",
						},
						modal: true,
					},
					data: {
						existingName: model.value.name,
					},
					onClose(options) {
						if (!options?.data) {
							return
						}

						model.value.name = options.data as string
					},
				})
			},
		},
		{
			label: "Delete",
			icon: "mdi mdi-delete",
			command(event) {
				emit("delete")
			},
		},
	]
})

function onClick(ev: MouseEvent) {
	if (ev.button != 0) return
	emit("click", ev)
}

function onContext(ev: Event) {
	contextMenu.value?.show(ev)
}
</script>

<style scoped>
.widget-list-item {
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 0 0.5rem;
}

.widget-list-item.selected {
	background-color: rgba(96, 165, 250, 0.16);
}
</style>
