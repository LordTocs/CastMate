<template>
	<div class="project-view">
		<project-group-or-item v-for="pi in projectStore.projectItems" :group-or-item="pi" />
		<!-- <project-category title="Profiles" icon="mdi mdi-card-account-details-outline">
			<project-item v-for="(profile, i) in profiles" :title="profile.name" :key="profile.id" :indent="1">
				<template #end>
					<toggle-input v-model="profiles[i].state" />
				</template>
			</project-item>
		</project-category>
		<project-category title="Overlays" icon="mdi mdi-picture-in-picture-top-right">
			<project-item v-for="(overlay, i) in overlays" :title="overlay.name" :key="overlay.id" :indent="1">
			</project-item>
		</project-category>
		<project-item title="SpellCast" icon="cmi cmi-spellcast" />
		<project-item title="Media" icon="mdi mdi-multimedia" />
		<project-item title="Channel Point Rewards" icon="mdi mdi-star-circle-outline" /> -->
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import ProjectGroupOrItem from "./ProjectGroupOrItem.vue"
import { ToggleInput, useProjectStore } from "castmate-ui-core"
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
