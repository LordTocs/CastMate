<template>
	<filter-palette :items="allItems" ref="palette" :append-to="appendTo">
		<template #submenuheader="{ item }">
			<span
				class="p-menuitem-icon"
				style="margin-right: 0.5rem; color: var(--item-color)"
				:class="item.icon"
				v-if="item.icon"
			></span
			>{{ item.label }}
		</template>
		<template #item="{ item }">
			<a class="p-menuitem-link">
				<span
					class="p-menuitem-icon"
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
import { MenuItem } from "primevue/menuitem"
import { computed, ref } from "vue"
import { ActionSelection, usePluginStore, FilterPalette } from "castmate-ui-core"

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
