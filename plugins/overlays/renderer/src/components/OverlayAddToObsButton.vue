<template>
	<div v-if="obsId == null">
		<div class="p-text-secondary">Connect OBS</div>
	</div>
	<div v-else-if="!hasObs">
		<p-button v-if="isLocalObs" @click="openObs"><i class="obsi obsi-obs"></i>Open</p-button>
		<div
			class="p-text-secondary"
			style="font-size: 0.875rem"
			v-else
			v-tooltip="`CastMate can't start OBS on remote machines`"
		>
			Remote OBS
		</div>
	</div>
	<div v-else-if="!hasSource">
		<p-button @click="createSourceClick"><i class="obsi obsi-obs"></i>Create Source</p-button>
	</div>
	<div v-else>
		{{ sourceName }}
		<p-button v-if="hasError" icon="mdi mdi-wrench" v-tooltip="'Fix Issues'" @click="fixErrorsClick"></p-button>
	</div>
</template>

<script setup lang="ts">
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { computed, onMounted, ref, watch } from "vue"

import PButton from "primevue/button"
import { useResource, useResourceIPCCaller, useSettingValue } from "castmate-ui-core"
import { ResourceData } from "castmate-schema"
import { OBSConnectionConfig, OBSConnectionState } from "castmate-plugin-obs-shared"
import { asyncComputed } from "@vueuse/core"

const obs = useResource<ResourceData<OBSConnectionConfig, OBSConnectionState>>("OBSConnection", () => props.obsId)

const openProcess = useResourceIPCCaller<() => any>("OBSConnection", () => props.obsId, "openProcess")
const findBrowserByUrlPattern = useResourceIPCCaller<(pattern: string) => any>(
	"OBSConnection",
	() => props.obsId,
	"findBrowserByUrlPattern"
)

const getRemoteHost = useResourceIPCCaller<() => string>("OBSConnection", () => props.obsId, "getRemoteHost")

const updateSourceSettings = useResourceIPCCaller<(sourceName: string, settings: object) => any>(
	"OBSConnection",
	() => props.obsId,
	"updateSourceSettings"
)
const createNewSource = useResourceIPCCaller<
	(sourceKind: string, sourceName: string, sceneName: string, settings: object) => string
>("OBSConnection", () => props.obsId, "createNewSource")

const isLocalObs = computed(() => {
	if (!obs.value) return
	return obs.value.config.host == "127.0.0.1" || obs.value.config.host == "localhost"
})

const props = defineProps<{
	obsId: string | undefined
	overlayConfig: OverlayConfig
	overlayId: string
}>()

const searching = ref(false)
const sourceName = ref<string>()

const hasSource = computed(() => sourceName.value != null)
const hasError = ref(false)
const hasObs = computed(() => {
	return obs.value?.state?.connected
})

const port = useSettingValue<string>({ plugin: "castmate", setting: "port" })

onMounted(() => {
	watch(
		() => ({ obs: props.obsId, id: props.overlayId, connected: hasObs.value }),
		() => {
			findBrowserSource()
		},
		{ immediate: true, deep: true }
	)
})

async function getOverlayURL() {
	const remoteHost = await getRemoteHost()

	return `http://${remoteHost}:${port.value}/overlays/${props.overlayId}`
}

/**
 * Regex match for overlays that have this overlay ID
 */
const urlPattern = computed(() => {
	return `http://[\\w]+(:[\\d]+)?[/\\\\]overlays[/\\\\]${props.overlayId}`
})

async function findBrowserSource() {
	const source = await findBrowserByUrlPattern(urlPattern.value)

	console.log("Found Potential Source", source)

	sourceName.value = source.inputName
	const expectedUrl = await getOverlayURL()

	let valid = true

	if (source) {
		valid =
			source.inputSettings.url == expectedUrl &&
			source.inputSettings.width == props.overlayConfig.size.width &&
			source.inputSettings.height == props.overlayConfig.size.height
	} else {
		valid = false
	}

	hasError.value = !valid
}

async function getBrowserSourceSettings() {
	return {
		url: await getOverlayURL(),
		width: props.overlayConfig.size.width,
		height: props.overlayConfig.size.height,
	}
}

async function createSourceClick(ev: MouseEvent) {
	if (!obs.value) return

	const newSourceName = await createNewSource(
		"browser_source",
		"CastMate Overlay!",
		obs.value.state.scene,
		await getBrowserSourceSettings()
	)
	sourceName.value = newSourceName
}

async function fixErrorsClick(ev: MouseEvent) {
	if (!sourceName.value) return

	await updateSourceSettings(sourceName.value, await getBrowserSourceSettings())
}

async function openObs() {
	if (!props.obsId) return
	await openProcess()
}
</script>

<style scoped></style>
