<template>
	<div class="app">
		<system-bar title="Hello World"></system-bar>
		<div class="app-row" v-if="initStore.inited">
			<project-view />
			<docking-area style="flex: 1" v-model="dockingStore.rootDockArea" />
		</div>
		<div class="load-row" v-else>
			<h3>Loading CastMate</h3>
			<p-progress-spinner />
		</div>
		<!-- <p-dynamic-dialog /> -->
		<cancellable-dynamic-dialog />
		<p-confirm-dialog />
	</div>
</template>

<script setup lang="ts">
import SystemBar from "./components/system/SystemBar.vue"
import {
	useDocumentStore,
	useDockingStore,
	DockingArea,
	type DockedArea,
	useIpcCaller,
	CancellableDynamicDialog,
	useIpcMessage,
} from "castmate-ui-core"
import ProjectView from "./components/project/ProjectView.vue"

import PProgressSpinner from "primevue/progressspinner"

import PConfirmDialog from "primevue/confirmdialog"
import { useInitStore } from "./store/init-store"

import { setupGenericLoginService } from "castmate-ui-core"
import { onMounted } from "vue"
import { useDialog } from "primevue/usedialog"
import MigrationDialog from "./components/migration/MigrationDialog.vue"
import FirstTimeSetupDialog from "./components/setup/FirstTimeSetupDialog.vue"

const initStore = useInitStore()
const dockingStore = useDockingStore()

setupGenericLoginService()

const dialog = useDialog()

function startMigration() {
	dialog.open(MigrationDialog, {
		props: {
			style: {
				width: "75vw",
			},
			modal: true,
			closable: false,
		},
		onClose(options) {
			if (!options?.data) {
			}
		},
	})
}

function startFirstTimeSetup() {
	dialog.open(FirstTimeSetupDialog, {
		props: {
			style: {
				width: "75vw",
			},
			showHeader: false,
			modal: true,
			closable: false,
		},
		onClose(options) {
			if (!options?.data) {
			}
		},
	})
}

const needsMigrate = useIpcCaller<() => boolean>("oldMigration", "needsMigrate")

useIpcMessage("oldMigration", "needsMigrate", () => {
	startMigration()
})

onMounted(async () => {
	if (await needsMigrate()) {
		startMigration()
	}

	await initStore.waitForInit()
	if (true) {
		//startFirstTimeSetup()
	}
})
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

.load-row {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
</style>
