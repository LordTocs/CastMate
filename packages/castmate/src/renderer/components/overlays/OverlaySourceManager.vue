<template>
	<div v-if="!isObsConnected">
		<span class="text-medium-emphasis mx-2">OBS Not Connected:</span>
		<v-btn
			@click="openOBS"
			variant="outlined"
			prepend-icon="mdi-open-in-app"
			size="small"
		>
			Launch OBS
		</v-btn>
	</div>
	<template v-else>
		<template v-if="!browserSourceName">
			<span class="mx-2 text-medium-emphasis"
				>OBS Source Not Found:
			</span>
			<v-btn @click="tryCreateSource" size="small" class="mx-2">
				Create Source
			</v-btn>
		</template>
		<template v-else>
			<span class="mx-2">
				<span class="text-medium-emphasis"> OBS Source:</span>
				{{ browserSourceName }}
			</span>
		</template>
		<v-btn
			variant="outlined"
			prepend-icon="mdi-wrench"
			color="error"
			v-if="!valid && !!browserSourceName"
			@click="fixBrowserSource"
		>
			Fix OBS Source
		</v-btn>
		<v-btn icon="mdi-refresh" @click="findBrowserSource" size="x-small" />
	</template>
	<v-btn
		icon="mdi-open-in-app"
		class="mx-2"
		size="x-small"
		:href="`http://localhost:${port}/overlays/${props.overlayId}`"
		target="_blank"
	></v-btn>
	<named-item-modal
		ref="nameModal"
		:header="`Create Browser Source`"
		label="Source Name"
		@created="createBrowserSource"
	/>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue"
import { usePluginStore } from "../../store/plugins"
import { useSettingsStore } from "../../store/settings"
import { useIpc } from "../../utils/ipcMap"
import NamedItemModal from "../dialogs/NamedItemModal.vue"

const pluginStore = usePluginStore()

const settingsStore = useSettingsStore()

const currentScene = computed(() => pluginStore.rootState.obs?.scene)
const isObsConnected = computed(() => pluginStore.rootState.obs?.connected)

const props = defineProps({
	overlay: {},
	overlayId: { type: String },
})

const urlPattern = computed(() => {
	return `http://[\\w]+(:[\\d]+)?[/\\\\]overlays[/\\\\]${props.overlayId}`
})

const findBrowserByUrlPattern = useIpc("obs", "findBrowserByUrlPattern")
const createNewSource = useIpc("obs", "createNewSource")

const openOBS = useIpc("obs", "openOBS")
const getOBSRemoteHost = useIpc("obs", "getOBSRemoteHost")

const port = computed(() => settingsStore.settings?.castmate?.port || 85)

const browserSourceName = ref(null)

const valid = ref(false)

async function getOverlayURL() {
	const remoteHost = await getOBSRemoteHost()
	return `http://${remoteHost}:${port.value}/overlays/${props.overlayId}`
}

async function findBrowserSource() {
	const source = await findBrowserByUrlPattern(urlPattern.value)

	browserSourceName.value = source.inputName

	const expectedUrl = await getOverlayURL()

	if (source) {
		valid.value =
			source.inputSettings.url == expectedUrl &&
			source.inputSettings.width == props.overlay.width &&
			source.inputSettings.height == props.overlay.height
	} else {
		valid.value = false
	}

	console.log(source)
}

const updateSourceSettings = useIpc("obs", "updateSourceSettings")

async function fixBrowserSource() {
	if (!browserSourceName.value) return

	updateSourceSettings(browserSourceName.value, {
		url: await getOverlayURL(),
		width: props.overlay.width,
		height: props.overlay.height,
	})

	valid.value = true
}

watch(isObsConnected, () => {
	if (isObsConnected.value) {
		findBrowserSource()
	}
})

async function createBrowserSource(name) {
	console.log("Creating Source", name)
	const url = await getOverlayURL()

	await createNewSource("browser_source", name, currentScene.value, {
		width: props.overlay.width,
		height: props.overlay.height,
		url,
	})

	browserSourceName.value = name
	valid.value = true
}

const nameModal = ref(null)
async function tryCreateSource() {
	nameModal.value.open()
}

onMounted(() => {
	if (isObsConnected.value) findBrowserSource()
})
</script>
