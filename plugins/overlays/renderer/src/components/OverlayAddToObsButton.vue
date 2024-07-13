<template>
	<div v-if="obsId == null" class="display-box">
		<div class="p-text-secondary">Connect OBS</div>
	</div>
	<div v-else-if="!hasObs">
		<p-button v-if="isLocalObs" @click="openObs"><i class="obsi obsi-obs"></i> Open OBS</p-button>
		<div
			class="p-text-secondary display-box"
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
	<div class="display-box" v-else>
		<i class="mdi mdi-web-box"></i>
		{{ sourceName }}
		<p-button
			v-if="hasError"
			class="extra-small-button ml-1"
			size="small"
			icon="mdi mdi-wrench"
			v-tooltip="'Fix Issues'"
			@click="fixErrorsClick"
		></p-button>
	</div>
</template>

<script setup lang="ts">
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { computed, onMounted, ref, watch } from "vue"

import PButton from "primevue/button"
import { NameDialog, useResource, useResourceIPCCaller, useSettingValue } from "castmate-ui-core"
import { ResourceData } from "castmate-schema"
import { OBSConnectionConfig, OBSConnectionState } from "castmate-plugin-obs-shared"
import { asyncComputed } from "@vueuse/core"
import { useDialog } from "primevue/usedialog"

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
		async () => {
			try {
				await findBrowserSource()
			} catch {}
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

const dialog = useDialog()

async function createSourceClick(ev: MouseEvent) {
	if (!obs.value) return

	dialog.open(NameDialog, {
		props: {
			header: "Create Browser Source",
			style: {
				width: "25vw",
			},
			modal: true,
		},
		async onClose(options) {
			if (!options?.data) {
				return
			}

			if (!obs.value) return

			await createNewSource(
				"browser_source",
				options.data,
				obs.value.state.scene,
				await getBrowserSourceSettings()
			)
			setTimeout(findBrowserSource, 200)
		},
	})
}

async function fixErrorsClick(ev: MouseEvent) {
	if (!sourceName.value) return

	await updateSourceSettings(sourceName.value, await getBrowserSourceSettings())

	await findBrowserSource()
}

async function openObs() {
	if (!props.obsId) return
	await openProcess()
}
</script>

<style scoped>
.display-box {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;

	border-radius: var(--border-radius);
	background-color: var(--surface-d);

	padding: 0.5rem;

	margin: 0.5rem;
}
</style>
