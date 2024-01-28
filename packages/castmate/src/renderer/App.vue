<template>
	<div class="app">
		<system-bar title="Hello World"></system-bar>
		<div class="app-row">
			<project-view v-if="initStore.inited" />
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
import { getCurrentInstance, inject, onMounted, ref } from "vue"
import { nanoid } from "nanoid/non-secure"
import PDynamicDialog from "primevue/dynamicdialog"
import PConfirmDialog from "primevue/confirmdialog"
import { useInitStore } from "./store/init-store"
//@ts-ignore
//import { useDialog, PrimeVueDialogSymbol } from "primevue/usedialog"

const initStore = useInitStore()
const dockingStore = useDockingStore()
/*
//@ts-ignore
const instance = getCurrentInstance()
if (instance?.appContext?.provides) {
	console.log("AppProvides", instance?.appContext?.provides)
	console.log("AppProvides[PrimeVueDialogSymbol]", instance?.appContext?.provides?.[PrimeVueDialogSymbol])
}

const dialog = useDialog()
*/
</script>

<style>
body {
	background: #0f0f0f;
	color: white;
	margin: 0;
	font-family: var(--font-family);
	overflow: hidden;
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
