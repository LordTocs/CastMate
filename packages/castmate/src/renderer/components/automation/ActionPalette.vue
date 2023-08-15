<template>
	<p-portal :append-to="appendTo">
		<div class="palette" :style="{ '--page-x': `${pageX}px`, '--page-y': `${pageY}px` }" v-if="visible" @click.stop>
			<p-menu :model="allItems">
				<template #start>
					<span class="w-full p-inputgroup">
						<p-input-text v-model="filter" ref="filterInput" placeholder="Filter Actions" />
					</span>
				</template>
				<template #item="{ item }">
					<div
						class="p-menuitem-content"
						v-if="!item.items"
						:style="{
							...item.style,
						}"
					>
						<a class="p-menuitem-link" tabindex="-1" aria-hidden="true">
							<span
								class="p-menuitem-icon"
								style="color: var(--item-color)"
								:class="item.icon"
								v-if="item.icon"
							></span>
							<span class="p-menuitem-text">{{ item.label }}</span>
						</a>
					</div>
					<div
						class="p-menuitem-content"
						v-else
						:style="{
							...item.style,
							borderBottom: `2px solid var(--item-color)`,
						}"
					>
						<span
							class="p-menuitem-icon"
							style="margin-right: 0.5rem; color: var(--item-color)"
							:class="item.icon"
							v-if="item.icon"
						></span
						>{{ item.label }}
					</div>
				</template>
			</p-menu>
		</div>
	</p-portal>
</template>

<script setup lang="ts">
import PPortal from "primevue/portal"
import PInputText from "primevue/inputtext"
import PMenu from "primevue/menu"
import { MenuItem } from "primevue/menuitem"

import { computed, onMounted, ref, nextTick, markRaw } from "vue"
import { ActionSelection, usePluginStore } from "castmate-ui-core"

import { useEventListener } from "@vueuse/core"

const props = withDefaults(
	defineProps<{
		appendTo?: string
	}>(),
	{
		appendTo: "body",
	}
)

const pluginStore = usePluginStore()

const pageX = ref<number>(0)
const pageY = ref<number>(0)

const filterInput = ref<{ $el: HTMLElement } | null>(null)

const emit = defineEmits(["selectAction"])

const filter = ref<string>("")
const filterLower = computed(() => filter.value.trim().toLocaleLowerCase())

const visible = ref(false)

useEventListener(
	computed(() => (visible.value ? markRaw(window) : undefined)),
	"click",
	(ev: MouseEvent) => {
		visible.value = false
	}
)

function passesFilter(name: string) {
	if (filterLower.value == "") return true
	return name.toLocaleLowerCase().includes(filterLower.value)
}

function close() {
	visible.value = false
}

function selectItem(selection: ActionSelection) {
	emit("selectAction", selection)
	close()
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
			},
		}

		let hasVisible = false

		for (let actionKey of Object.keys(plugin.actions)) {
			const action = plugin.actions[actionKey]

			const item: MenuItem = {
				label: action.name,
				key: action.id,
				icon: action.icon,
				command(event) {
					selectItem({ plugin: plugin.id, action: action.id })
				},
				visible: passesFilter(action.name),
				style: {
					"--item-color": action.color,
				},
			}

			if (item.visible) {
				hasVisible = true
			}

			category.items?.push(item)
		}

		category.visible = hasVisible
		result.push(category)
	}

	return result
})

defineExpose({
	open(event: MouseEvent) {
		filter.value = ""
		visible.value = true
		pageX.value = event.pageX
		pageY.value = event.pageY
		nextTick(() => filterInput.value?.$el?.focus())
	},
})
</script>

<style scoped>
.palette {
	position: absolute;
	left: var(--page-x);
	top: var(--page-y);
	max-height: 300px;
	box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);
}
</style>
