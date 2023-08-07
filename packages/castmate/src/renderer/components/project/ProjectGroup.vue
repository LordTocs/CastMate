<template>
	<div class="project-category">
		<div class="project-category-header" @click="expanded = !expanded" @contextmenu="contextMenu?.show($event)">
			<i :class="`mdi ${expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'}`"></i>
			<slot name="icon">
				<i :class="group.icon" class="px-1" v-if="group.icon"></i>
			</slot>
			<span style="flex: 1">{{ group.title }}</span>
			<p-context-menu ref="contextMenu" :model="menuItems" />
		</div>
		<div class="project-category-content" v-show="expanded">
			<project-group-or-item v-for="gi of group.items" :group-or-item="gi" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ProjectGroup } from "castmate-ui-core"
import ProjectGroupOrItem from "./ProjectGroupOrItem.vue"
import PContextMenu from "primevue/contextmenu"
import { computed, ref, toRaw } from "vue"
import { MenuItem } from "primevue/menuitem"

const props = defineProps<{
	group: ProjectGroup
}>()

const contextMenu = ref<PContextMenu | undefined>()
const menuItems = computed<MenuItem[] | undefined>(() => {
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

	user-select: none;
}

.project-category-header:hover {
	background-color: var(--highlight-bg);
}
</style>
