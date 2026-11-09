<template>
	<nav-panel-section icon="mdi mdi-star" v-model:open="open">
		<template #header> <i :class="open ? 'mdi mdi-folder-open' : 'mdi mdi-folder'" /> {{ info.name }} </template>
		<nav-project-item v-for="pi in info.items" :info="pi" />
	</nav-panel-section>
</template>

<script setup lang="ts">
import { ProjectTreeFolderInfo } from "castmate-schema"
import NavPanelSection from "./NavPanelSection.vue"
import NavProjectItem from "./NavProjectItem.vue"
import { ref } from "vue"

const props = defineProps<{
	info: ProjectTreeFolderInfo
}>()

const open = ref(false)
</script>

<style scoped>
:deep(.nav-section-content) {
	padding-left: 1rem;
}

:deep(.nav-section-header) {
	padding: 0;
}
</style>
