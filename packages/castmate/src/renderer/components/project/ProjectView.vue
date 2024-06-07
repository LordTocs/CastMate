<template>
	<flex-scroller class="project-view">
		<project-group-or-item v-for="pi in projectStore.projectItems" :group-or-item="pi" />
	</flex-scroller>
</template>

<script setup lang="ts">
import { ref } from "vue"
import ProjectGroupOrItem from "./ProjectGroupOrItem.vue"
import { ToggleInput, useProjectStore, FlexScroller } from "castmate-ui-core"
import { type Toggle } from "castmate-schema"

const projectStore = useProjectStore()

const profiles = ref([
	{
		id: "abc",
		name: "Prof 1",
		active: false,
		state: "toggle" as Toggle,
	},
	{
		id: "bcd",
		name: "Prof 2",
		active: false,
		state: "toggle" as Toggle,
	},
	{
		id: "cde",
		name: "Prof 3",
		active: true,
		state: "toggle" as Toggle,
	},
])

const overlays = ref([
	{
		id: "def",
		name: "Overlay 1",
	},
	{
		id: "efg",
		name: "Overlay 2",
	},
])
</script>

<style scoped>
.project-view {
	width: 300px;
	height: 100%;
	background-color: var(--surface-b);
	flex-shrink: 0;
}
</style>
