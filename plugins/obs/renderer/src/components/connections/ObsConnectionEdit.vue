<template>
	<div class="pb-2">
		<div style="width: 800px">
			CastMate can control OBS over OBS's WebSocket Server. You must first enable the websocket server in OBS so
			CastMate can connect to it.
			<ol>
				<li class="text-center">
					Open the <span class="code-like">WebSocket Server Settings</span> in OBS.<br />
					<img src="../../img/WebsocketServerSettings.png" class="mt-1" />
				</li>
				<li class="text-center">
					Make sure the
					<span class="code-like"><i class="mdi mdi-checkbox-outline" /> Enable WebSocket server</span>
					checkbox is checked AND you've
					<b>clicked apply.</b>
					<img src="../../img/EnableWebsocketServer.png" class="mt-1" />
				</li>

				<li class="text-center">
					Click <span class="code-like">Show Connect Info</span> button to open QR code.
					<img src="../../img/ShowConnectInfo.png" class="mt-1" />
				</li>

				<li class="text-center">
					With the QR Code window still open, click the
					<span class="code-like"> <i class="mdi mdi-qrcode-scan" /> </span> button below. (It doesn't matter
					if it's hidden behind other windows).
				</li>
			</ol>
		</div>
		<div class="flex flex-column gap-5">
			<p-float-label variant="on" style="flex: 1">
				<p-input-text v-model="model.name" fluid />
				<label>CastMate Connection Name</label>
			</p-float-label>
			<div class="flex flex-row gap-1">
				<p-button @click="readQR" v-tooltip="'Scan Connect Info QR Code'">
					<i class="mdi mdi-qrcode-scan" style="font-size: x-large" />
				</p-button>
				<div class="flex flex-column gap-3 flex-grow-1">
					<div class="flex flex-row gap-1">
						<p-float-label variant="on" style="flex: 1">
							<p-input-text v-model="model.host" fluid />
							<label>OBS Ip Address</label>
						</p-float-label>
						<p-float-label variant="on">
							<p-input-number
								v-model="model.port"
								:use-grouping="false"
								:min="0"
								:max="65535"
								:pt="{ pcInputText: { root: 'port-input' } }"
							/>
							<label>Port</label>
						</p-float-label>
					</div>
					<p-float-label variant="on">
						<p-password v-model="model.password" toggle-mask fluid :feedback="false" />
						<label>WebSocket Password</label>
					</p-float-label>
				</div>
				<p-button :severity="testSeverity" :loading="testing" @click="testDetails">
					<template v-if="testSuccess == null"> Test </template>
					<template v-else-if="testSuccess"> <i class="mdi mdi-check-bold" /> </template>
					<template v-else> <i class="mdi mdi-close-thick" /> </template>
				</p-button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, useModel } from "vue"
import { OBSConnectionConfig } from "castmate-plugin-obs-shared"

import PFloatLabel from "primevue/floatlabel"
import PInputText from "primevue/inputtext"
import PInputNumber from "primevue/inputnumber"
import PPassword from "primevue/password"
import PButton from "primevue/button"
import { useIpcCaller } from "castmate-ui-core"

const props = defineProps<{
	modelValue: OBSConnectionConfig
	resourceId: string
	resourceType: string
}>()

const model = useModel(props, "modelValue")

interface OBSConnectDetails {
	host: string
	port: number
	password: string
}

const attemptQRReading = useIpcCaller<() => OBSConnectDetails | undefined>("obs", "attemptQRReading")
const testOBSConnectionDetails = useIpcCaller<
	(hostname: string, port: number, password: string | undefined) => boolean
>("obs", "testOBSConnectionDetails")

async function readQR() {
	console.log("READ QR")
	const result = await attemptQRReading()
	console.log("QR READ", result)

	if (result) {
		model.value.host = result.host
		model.value.port = result.port
		model.value.password = result.password
	}
}

const testSuccess = ref<boolean>()
const testSeverity = computed(() => {
	if (testSuccess.value == null) return undefined
	if (testSuccess.value) return "success"
	return "danger"
})
const testing = ref(false)

async function testDetails() {
	testing.value = true
	testSuccess.value = await testOBSConnectionDetails(model.value.host, model.value.port, model.value.password)
	testing.value = false
}
</script>

<style scoped>
:deep(.port-input) {
	width: 100px;
}

.code-like {
	font-family: monospace;
	border: solid 1px var(--surface-border);
	border-radius: var(--border-radius);
	padding: 0.2rem 0.5rem;
}
</style>
