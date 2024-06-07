<template>
	<div class="project-category">
		<div
			class="project-category-header"
			:style="{ '--indent': indent }"
			@click="expanded = !expanded"
			@contextmenu="showContext"
			ref="header"
		>
			<i :class="`mdi ${expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'}`"></i>
			<slot name="icon">
				<i :class="group.icon" class="px-1" v-if="group.icon"></i>
			</slot>
			<span style="flex: 1">{{ group.title }}</span>
			<p-button icon="mdi mdi-dots-vertical" class="p-0" v-if="!isOutside && hasMenu" @click="menuClick" text />
			<c-context-menu ref="contextMenu" :items="menuItems" />
			<p-menu ref="menu" :model="menuItems" :popup="true" v-if="hasMenu" />
		</div>
		<div class="project-category-content" v-show="expanded">
			<project-group-or-item :indent="indent + 1" v-for="gi of group.items" :group-or-item="gi" :key="gi.id" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ProjectGroup, CContextMenu } from "castmate-ui-core"
import ProjectGroupOrItem from "./ProjectGroupOrItem.vue"
import { computed, ref, toRaw } from "vue"
import type { MenuItem } from "primevue/menuitem"
import PButton from "primevue/button"
import PMenu from "primevue/menu"
import { useMouseInElement } from "@vueuse/core"

const props = withDefaults(
	defineProps<{
		group: ProjectGroup
		indent?: number
	}>(),
	{
		indent: 0,
	}
)

const contextMenu = ref<InstanceType<typeof CContextMenu>>()
const menuItems = computed<MenuItem[]>(() => {
	const items: MenuItem[] = []

	if (props.group.create) {
		items.push({
			label: "New",
			icon: "mdi mdi-new",
			command: (event) => {
				props.group.create?.()
			},
		})
	}

	return items
})
const hasMenu = computed(() => {
	return menuItems.value.length > 0
})

const menu = ref<PMenu>()
const header = ref<HTMLElement>()

const { isOutside } = useMouseInElement(header)

function menuClick(ev: MouseEvent) {
	ev.stopPropagation()
	menu.value?.toggle(ev)
}

function showContext(ev: MouseEvent) {
	if (menuItems.value.length == 0) return

	contextMenu.value?.show(ev)
}

const expanded = ref(false)
</script>

<style scoped>
.project-category {
	width: 100%;
}

.project-category-header {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	height: 2rem;
	padding-left: calc(var(--indent) * 1em);
	user-select: none;
}

.project-category-header:hover {
	background-color: var(--highlight-bg);
}
</style>
