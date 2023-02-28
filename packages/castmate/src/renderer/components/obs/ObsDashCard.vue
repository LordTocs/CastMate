<template>
	<v-card class="d-flex flex-column" v-if="!isOBSConfigured">
		<v-alert dense variant="outlined" type="warning" class="mx-2 my-2">
			OBS not configured!<br />
			CastMate uses OBS Websocket 5.0+
		</v-alert>
		<v-spacer />
		<v-card-actions>
			<v-btn link to="/plugins/obs" prepend-icon="mdi-cog" size="small">
				Settings
			</v-btn>
		</v-card-actions>
	</v-card>
	<v-card v-else class="d-flex flex-column">
		<v-card-text
			class="d-flex flex-row justify-center flex-grow-1"
			v-if="isOBSConnected"
		>
			<div class="mx-4 d-flex flex-column justify-end">
				<p class="text-subtitle-1 text-center">
					<v-icon
						:color="recording ? 'red' : 'grey-darken-3'"
						:icon="recording ? 'mdi-record' : 'mdi-record'"
					/>
				</p>
				<p class="text-subtitle-2 text-medium-emphasis text-center">
					Recording
				</p>
			</div>
			<v-divider vertical />
			<div class="mx-4 d-flex flex-column justify-end">
				<p class="text-subtitle-1 text-center">
					<v-icon
						:color="streaming ? 'blue' : 'grey-darken-3'"
						:icon="
							streaming ? 'mdi-broadcast' : 'mdi-broadcast-off'
						"
					/>
				</p>
				<p class="text-subtitle-2 text-medium-emphasis text-center">
					Streaming
				</p>
			</div>
		</v-card-text>
		<v-card-text v-else class="d-flex flex-row justify-center flex-grow-1">
			<div class="mx-4 d-flex flex-column justify-end">
				<p class="text-subtitle-1 text-center">
					<v-btn
						@click="() => openOBS()"
						prepend-icon="mdi-open-in-app"
						variant="outlined"
						size="small"
						class="mb-1"
					>
						Launch OBS
					</v-btn>
				</p>
				<p class="text-subtitle-2 text-medium-emphasis text-center">
					OBS Disconnected
				</p>
			</div>
		</v-card-text>
		<v-card-actions>
			<v-btn
				v-if="!isOBSConnected"
				link
				to="/plugins/obs"
				prepend-icon="mdi-cog"
				size="small"
			>
				Settings
			</v-btn>
			<v-btn
				v-if="isOBSConnected"
				@click="() => refreshAllBrowsers()"
				prepend-icon="mdi-refresh"
				size="small"
			>
				Refresh Browsers
			</v-btn>
		</v-card-actions>
	</v-card>
</template>

<script setup>
import { computed } from "vue"
import { usePluginStore } from "../../store/plugins"
import { useSettingsStore } from "../../store/settings"
import { useIpc } from "../../utils/ipcMap"

const pluginStore = usePluginStore()
const settingStore = useSettingsStore()

const isOBSConnected = computed(() => pluginStore.rootState.obs.connected)
const streaming = computed(() => pluginStore.rootState.obs.streaming)
const recording = computed(() => pluginStore.rootState.obs.recording)

const isOBSConfigured = computed(() => {
	return !!settingStore.settings.obs.hostname
})

const refreshAllBrowsers = useIpc("obs", "refreshAllBrowsers")
const openOBS = useIpc("obs", "openOBS")
</script>
