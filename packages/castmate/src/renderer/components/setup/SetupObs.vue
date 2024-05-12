<template>
	<div>
		<h1 class="text-center mb-0"><i class="obsi obsi-obs obs-blue"></i>Setup OBS <migration-check-box :checked="ready" /></h1>
		<p class="p-text-secondary text-center">CastMate needs to connect to OBS through the OBS Websocket Server in order for OBS actions to work.</p>
		<div class="flex flex-row align-items-start justify-content-center gap-4 w-full image-row">
			<img class="guide-image" src="../../assets/setup/websocket-dropdown.png"></img>
			<img class="guide-image" src="../../assets/setup/websocket-settings.png"></img>
			<img class="guide-image" src="../../assets/setup/websocket-connectinfo.png"></img>
		</div>
		<div class="flex flex-row gap-1">
			<div class="flex-grow-1 w-0 flex flex-column justify-content-center">
				<p class="text-center p-text-secondary">
					If the WebSocket Connect Info dialog is open on this computer, you can click this button to automatically detect the connection settings.
				</p>
				<div class="flex flex-row justify-content-center">
					<p-button @click="readQR">Grab Connection Info</p-button>
				</div>
				<p class="text-center p-text-secondary">
					If OBS is on a different PC, you'll need to enter the IP, Port, and Password.
				</p>
			</div>
			<div class="flex-grow-1 w-0">
				<data-input v-model="obsConfig" :schema="obsConfigSchema"></data-input>
				<div class="flex flex-row justify-content-center">
					<p-button @click="saveSettings">Save</p-button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { SchemaType } from "castmate-schema"
import { declareSchema } from "castmate-schema"
import { DataInput, useIpcCaller, useResourceArray, useResourceStore } from "castmate-ui-core"
import { ref, onMounted, computed } from "vue"

import MigrationCheckBox from "../migration/MigrationCheckBox.vue"
import PButton from "primevue/button"
import { ResourceData } from "castmate-schema"
import { OBSConnectionConfig, OBSConnectionState } from "castmate-plugin-obs-shared"

const obsConfigSchema = declareSchema({
	type: Object,
	properties: {
		host: { type: String, name: "Server IP", required: true, default: "localhost" },
		port: { type: Number, name: "Server Port", required: true, default: 4455 },
		password: { type: String, name: "Server Password" },
	},
})

type ObsPartialConfig = SchemaType<typeof obsConfigSchema>

const obsConfig = ref<ObsPartialConfig>({
	host: "localhost",
	port: 4455,
	password: undefined,
})

const mainObsId = ref<string>()

const attemptQRReading = useIpcCaller<() => ObsPartialConfig | undefined>("obs", "attemptQRReading")

const resourceStore = useResourceStore()
const connections = useResourceArray<ResourceData<OBSConnectionConfig, OBSConnectionState>>("OBSConnection")

const mainObs = computed(() => connections.value.find(c => c.id == mainObsId.value))

const ready = computed(() => !!mainObs.value?.state?.connected)

function findMainObs() {
	if (connections.value.length == 0) {
		mainObsId.value = undefined
	}

	const main = connections.value.find(c => c.config.name == "Main OBS")
	if (main) {
		mainObsId.value = main.id
		console.log("Found OBS Id", mainObsId.value)
		return
	}

	mainObsId.value = connections.value[0]?.id

	console.log("Found OBS Id", mainObsId.value)
}

async function readQR() {
	const result = await attemptQRReading()

	if (result) {
		obsConfig.value.host = result.host
		obsConfig.value.port = result.port
		obsConfig.value.password = result.password

		await saveSettings()
	}
}

onMounted(() => {
	findMainObs()

	if (mainObs.value) {
		obsConfig.value = {
			host: mainObs.value.config.host,
			port: mainObs.value.config.port,
			password: mainObs.value.config.password
		}
	}
})

async function saveSettings() {
	console.log("Settings Saved", obsConfig.value)
	if (mainObsId.value == null) {
		const newId = await resourceStore.createResource("OBSConnection", {
			name: "Main OBS",
			...obsConfig.value
		})
		mainObsId.value = newId
	} else {
		await resourceStore.applyResourceConfig("OBSConnection", mainObsId.value, obsConfig.value)
	}
}
</script>

<style scoped>
.guide-image {
	min-width: 10px;
	max-height: 100%;
	flex-shrink: 1;
	flex-grow: 0;
}

.image-row {
	height: 240px;
}
</style>
