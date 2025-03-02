<template>
	<main-page-card>
		<template #header>
			<i class="obsi obsi-obs obs-color" /> {{ connection.config.name }}
			<span style="color: var(--p-surface-400)" v-if="!connection.state.connected"> (Not Connected) </span>
		</template>
		<div class="flex flex-row">
			<div class="flex flex-row justify-content-center flex-grow-1">
				<template v-if="!connection.state.connected">
					<div class="flex flex-column gap-2 text-center" v-if="!showConnectionIssue">
						Not Connected
						<div class="flex flex-row gap-1">
							<p-button size="small" @click="openObs" :disabled="!connection.config.local">
								<span v-if="connection.config.local">Open OBS</span>
								<span v-else>Can't Open Remote OBS</span>
							</p-button>
							<p-button size="small" @click="edit" severity="secondary"> Edit </p-button>
						</div>
					</div>
					<div class="flex flex-column gap-2 text-center" v-else>
						OBS is running, but CastMate isn't connected.
						<div class="flex flex-row gap-1 justify-content-center">
							<p-button size="small" @click="edit" severity="secondary"> Edit </p-button>
						</div>
					</div>
				</template>
				<template v-else>
					<main-page-card-item label="Streaming">
						<i
							:style="{ color: connection.state.streaming ? 'blue' : 'var(--p-surface-400)' }"
							:class="connection.state.streaming ? 'mdi mdi-broadcast' : 'mdi mdi-broadcast-off'"
						/>
					</main-page-card-item>
					<main-page-card-item label="Recording">
						<i
							:style="{ color: connection.state.recording ? 'red' : 'var(--p-surface-400)' }"
							:class="connection.state.recording ? 'mdi mdi-record' : 'mdi mdi-record'"
						/>
					</main-page-card-item>
				</template>
			</div>
			<div v-if="connection.state.connected">
				<p-button
					class="ml-1"
					text
					icon="mdi mdi-dots-vertical"
					aria-controls="input_menu"
					@click="menu?.toggle($event)"
				></p-button>
				<p-menu ref="menu" id="input_menu" :model="menuItems" :popup="true" />
			</div>
		</div>
	</main-page-card>
</template>

<script setup lang="ts">
import { MainPageCard, MainPageCardItem, useResourceEditDialog, useResourceIPCCaller, useState } from "castmate-ui-core"
import { OBSConnectionConfig, OBSConnectionState } from "castmate-plugin-obs-shared"
import { ResourceData } from "castmate-schema"

import PButton from "primevue/button"
import PMenu from "primevue/menu"
import type { MenuItem } from "primevue/menuitem"
import { computed, ref } from "vue"

const props = defineProps<{
	connection: ResourceData<OBSConnectionConfig, OBSConnectionState>
}>()

const openProcess = useResourceIPCCaller<() => any>("OBSConnection", () => props.connection.id, "openProcess")

const localRunning = useState<boolean>({ plugin: "obs", state: "localObsRunning" })

const showConnectionIssue = computed(() => {
	return localRunning.value?.value && !props.connection.state.connected && props.connection.config.local
})

async function openObs() {
	if (!props.connection.id) return
	await openProcess()
}

const menu = ref<InstanceType<typeof PMenu>>()

const refreshAllBrowsers = useResourceIPCCaller<() => any>(
	"OBSConnection",
	() => props.connection.id,
	"refreshAllBrowsers"
)

const editDialog = useResourceEditDialog("OBSConnection")

function edit() {
	editDialog(props.connection.id)
}

const menuItems = computed<MenuItem[]>(() => {
	let result: MenuItem[] = []

	result.push({
		label: "Refresh All Browsers",
		command(event) {
			refreshAllBrowsers()
		},
	})

	result.push({
		label: "Edit Connection",
		command(event) {
			edit()
		},
	})

	return result
})
</script>

<style scoped>
.connection-widget {
	border-radius: var(--border-radius);
	border: solid 2px var(--surface-border);
	padding: 0.25rem;
}

.obs-color {
	color: #256eff;
}
</style>
