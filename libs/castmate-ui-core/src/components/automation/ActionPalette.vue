<template>
	<filter-palette :items="allItems" ref="palette" :append-to="appendTo">
		<template #submenuheader="{ item }">
			<div class="text-center">
				<span
					class="p-menu-item-icon"
					style="margin-right: 0.5rem; color: var(--item-color)"
					:class="item.icon"
					v-if="item.icon"
				></span
				>{{ item.label }}
			</div>
		</template>
		<template #item="{ item }">
			<a class="p-menu-item-link">
				<span
					class="p-menu-item-icon"
					style="margin-right: 0.5rem; color: var(--item-color)"
					:class="item.icon"
					v-if="item.icon"
				></span
				>{{ item.label }}
			</a>
		</template>
	</filter-palette>
</template>

<script setup lang="ts">
import type { MenuItem } from "primevue/menuitem"
import { computed, ref } from "vue"
import { ActionSelection, usePluginStore, FilterPalette, DropListItem } from "../../main"

const props = withDefaults(
	defineProps<{
		appendTo?: string
	}>(),
	{
		appendTo: "body",
	}
)

const pluginStore = usePluginStore()

const emit = defineEmits(["selectAction"])
const palette = ref<typeof FilterPalette>()

function selectItem(selection: ActionSelection) {
	emit("selectAction", selection)
}

const allItems = computed<MenuItem[]>(() => {
	const result: MenuItem[] = []

	for (const plugin of pluginStore.pluginMap.values()) {
		const category: MenuItem = {
			label: plugin.name,
			key: plugin.id,
			icon: plugin.icon,
			items: [],
			style: {
				"--item-color": plugin.color,
				borderBottom: `2px solid var(--item-color)`,
				marginBottom: "2px",
				padding: `0.25rem 1rem`,
			},
		}

		for (let actionKey of Object.keys(plugin.actions)) {
			const action = plugin.actions[actionKey]

			const item: MenuItem = {
				label: action.name,
				key: action.id,
				icon: action.icon,
				filterExtra: plugin.id,
				command(event) {
					selectItem({ plugin: plugin.id, action: action.id })
				},
				style: {
					"--item-color": action.color,
				},
			}

			category.items?.push(item)
		}

		result.push(category)
	}

	return result
})

defineExpose({
	open(event: MouseEvent) {
		palette.value?.open(event)
	},
})
</script>
