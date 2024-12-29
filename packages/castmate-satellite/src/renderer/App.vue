<template>
	<div class="app" @keydown="onKeyDown" tabindex="-1">
		<system-bar title="CastMate Satellite"></system-bar>
		<div class="app-row" v-if="initStore.inited">
			<!-- <div>
				<account-widget account-type="TwitchAccount" account-id="channel" />
			</div>
			<dashboard-display /> -->
			<component v-if="activePage" :is="activePage" />
		</div>
		<div class="load-row" v-else>
			<h3>Loading CastMate Satellite</h3>
			<p-progress-spinner />
		</div>
		<!-- <p-dynamic-dialog /> -->
		<!-- <cancellable-dynamic-dialog /> -->
		<!-- <p-confirm-dialog /> -->
	</div>
</template>

<script setup lang="ts">
import SystemBar from "./components/system/SystemBar.vue"

import { AccountWidget, useInitStore, usePrimarySatelliteConnection } from "castmate-ui-core"

import PProgressSpinner from "primevue/progressspinner"
import PConfirmDialog from "primevue/confirmdialog"

import ConnectionPage from "./components/pages/ConnectionPage.vue"
import DashboardPage from "./components/pages/DashboardPage.vue"
import SlotsPage from "./components/pages/SlotsPage.vue"
import { useActivePage, usePageStore } from "./util/page-store"
import ConnectingPage from "./components/pages/ConnectingPage.vue"
import SettingsPage from "./components/pages/SettingsPage.vue"
import { onMounted, watch } from "vue"

const initStore = useInitStore()

const pageStore = usePageStore()
pageStore.page = "connectionSelection"

pageStore.registerPage("connecting", ConnectingPage)
pageStore.registerPage("dashboard", DashboardPage)
pageStore.registerPage("slots", SlotsPage)
pageStore.registerPage("connectionSelection", ConnectionPage)
pageStore.registerPage("settings", SettingsPage)

const connection = usePrimarySatelliteConnection()

const activePage = useActivePage()

onMounted(() => {
	watch(
		() => connection.value?.state,
		() => {
			if (!connection.value || connection.value.state == "disconnected") {
				pageStore.page = "connectionSelection"
			}
		}
	)
})

function onKeyDown(ev: KeyboardEvent) {
	if (ev.ctrlKey && ev.code == "KeyS") {
		if (ev.shiftKey) {
			//saveAllTabs()
		} else {
			//saveActiveTab()
		}
	}
}
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
	flex-direction: column;
}

.load-row {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
</style>
