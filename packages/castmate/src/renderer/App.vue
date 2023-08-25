<template>
	<div class="app">
		<system-bar title="Hello World"></system-bar>
		<div class="app-row">
			<project-view />
			<docking-area style="flex: 1" v-model="dockingStore.rootDockArea" />
		</div>
		<p-dynamic-dialog />
		<p-confirm-dialog />
	</div>
</template>

<script setup lang="ts">
import SystemBar from "./components/system/SystemBar.vue"
import { useDocumentStore, useDockingStore, DockingArea, type DockedArea, useIpcCaller } from "castmate-ui-core"
import ProjectView from "./components/project/ProjectView.vue"
import { onMounted, ref } from "vue"
import { nanoid } from "nanoid/non-secure"
import PDynamicDialog from "primevue/dynamicdialog"
import PConfirmDialog from "primevue/confirmdialog"

const dockingStore = useDockingStore()

const uiLoadComplete = useIpcCaller("plugins", "uiLoadComplete")

onMounted(() => {
	uiLoadComplete()
})
</script>

<style>
body {
	background: #0f0f0f;
	color: white;
	margin: 0;
	font-family: var(--font-family);
}
</style>

<style scoped>
.app {
	width: 100vw;
	height: 100vh;
	position: relative;
	display: flex;
	flex-direction: column;
}

.app-row {
	flex: 1;
	display: flex;
	flex-direction: row;
}
</style>
