<template>
	<main-page-card v-if="obs">
		<template #header>
			<div class="flex flex-row">
				<i class="obsi obsi-obs" /> {{ obs?.config?.name }}
				<div class="flex-grow-1" />
				<p-button
					v-if="obs.state.connected"
					icon="mdi mdi-refresh"
					size="small"
					class="extra-small-button"
					v-tooltip="'Refresh All Browsers'"
					@click="refreshAllBrowsers"
				/>
			</div>
		</template>
		<dashboard-card-item v-if="!obs.state.connected" label="Disconnected">
			<p-button v-if="isLocal" text @click="openObs">Open</p-button>
			<div
				class="p-text-secondary"
				style="font-size: 0.875rem"
				v-else
				v-tooltip="`CastMate can't start OBS on remote machines`"
			>
				Remote OBS
			</div>
		</dashboard-card-item>
		<template v-else-if="obs.state.connected">
			<dashboard-card-item label="Streaming">
				<i
					:style="{ color: obs.state.streaming ? 'blue' : 'var(--surface-300)' }"
					:class="obs.state.streaming ? 'mdi mdi-broadcast' : 'mdi mdi-broadcast-off'"
				/>
			</dashboard-card-item>
			<dashboard-card-item label="Recording">
				<i
					:style="{ color: obs.state.recording ? 'red' : 'var(--surface-300)' }"
					:class="obs.state.recording ? 'mdi mdi-record' : 'mdi mdi-record'"
				/>
			</dashboard-card-item>
		</template>
	</main-page-card>
</template>

<script setup lang="ts">
import { useResource, MainPageCard, DashboardCardItem, useResourceIPCCaller } from "castmate-ui-core"
import { OBSConnectionConfig, OBSConnectionState } from "castmate-plugin-obs-shared"
import { ResourceData } from "castmate-schema"
import { computed } from "vue"
import PButton from "primevue/button"

const props = defineProps<{
	obsId: string
}>()

const obs = useResource<ResourceData<OBSConnectionConfig, OBSConnectionState>>("OBSConnection", () => props.obsId)

const isLocal = computed(() => {
	if (!obs.value) return
	return obs.value.config.host == "127.0.0.1" || obs.value.config.host == "localhost"
})

const openProcess = useResourceIPCCaller<() => any>("OBSConnection", () => props.obsId, "openProcess")
const refreshAllBrowsers = useResourceIPCCaller<() => any>("OBSConnection", () => props.obsId, "refreshAllBrowsers")

async function openObs() {
	if (!props.obsId) return
	await openProcess()
}
</script>

<style scoped>
.obs-card {
	height: var(--dashboard-height);
	border-radius: var(--border-radius);
	border: solid 2px var(--surface-border);
	padding: 0rem;
	display: flex;
	flex-direction: row;
}
</style>
