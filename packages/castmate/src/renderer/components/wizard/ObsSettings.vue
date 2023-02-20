<template>
	<v-card>
		<v-card-text>
			<v-row>
				<v-col>
					<data-input
						:schema="
							addRequired(this.plugins.obs.settings.hostname)
						"
						label="Hostname"
						v-model="hostname"
					/>
				</v-col>
				<v-col>
					<data-input
						:schema="addRequired(this.plugins.obs.settings.port)"
						label="Port"
						v-model="port"
					/>
				</v-col>
			</v-row>
			<v-row>
				<v-col>
					<data-input
						:schema="addRequired(this.plugins.obs.secrets.password)"
						label="Password"
						v-model="password"
						secret
					/>
				</v-col>
			</v-row>
		</v-card-text>
		<v-card-actions>
			<v-spacer />
			<v-btn
				:color="connected ? 'success' : 'primary'"
				:loading="trying"
				size="large"
				@click="tryConnect"
				variant="outlined"
			>
				{{ connected ? "Successfully Connected" : "Connect" }}
			</v-btn>
			<v-spacer />
		</v-card-actions>
	</v-card>
</template>

<script setup>
import { onMounted } from "vue"
import { useSettingsStore } from "../../store/settings"
import { useIpc } from "../../utils/ipcMap"
import DataInput from "../data/DataInput.vue"

const hostname = ref("localhost")
const port = ref(4455)
const password = ref(null)

function addRequired(schema) {
	return { ...schema, required: true }
}

const connected = ref(false)
const trying = ref(false)

const tryConnectSettings = useIpc("obs", "tryConnectSettings")

async function tryConnect() {
	trying.value = true
	const result = await this.tryConnectSettings(
		this.hostname,
		this.port,
		this.password
	)
	trying.value = false

	if (result) {
		connected.value = true
		await save()
	}
}

const changeSettings = useIpc("settings", "changeSettings")
const changeSecrets = useIpc("settings", "changeSecrets")

async function save() {
	await Promise.all([
		changeSettings({
			...settingsStore.settings.obs,
			hostname: hostname.value,
			port: port.value,
		}),
		changeSecrets({
			...settingsStore.secrets.obs,
			password: password.value,
		}),
	])
}

const settingsStore = useSettingsStore()

onMounted(() => {
	hostname.value = settingsStore.settings.obs?.hostname || "localhost"
	port.value = settingsStore.settings.obs?.port || 4455
	password.value = settingsStore.secrets.obs?.password || null
})
</script>

<style></style>
