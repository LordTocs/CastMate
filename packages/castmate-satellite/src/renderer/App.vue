<template>
	<div class="app" @keydown="onKeyDown" tabindex="-1">
		<system-bar title="CastMate Satellite"></system-bar>
		<div class="app-row" v-if="initStore.inited">
			<div>SATELLITE!</div>
			<div>
				<account-widget account-type="TwitchAccount" account-id="channel" />
			</div>
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

import { AccountWidget, useInitStore } from "castmate-ui-core"

import PProgressSpinner from "primevue/progressspinner"
import PConfirmDialog from "primevue/confirmdialog"

const initStore = useInitStore()

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
