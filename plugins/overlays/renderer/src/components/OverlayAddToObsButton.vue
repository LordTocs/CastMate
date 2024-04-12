<template>
	<div v-if="obsId == null">
		<div class="p-text-secondary">Connect OBS</div>
	</div>
	<div v-else-if="!hasObs">
		<p-button v-if="isLocalObs" @click="openObs">Open</p-button>
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
		<p-button @click="createSourceClick">Create Source</p-button>
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
import { useResource, useResourceIPCCaller } from "castmate-ui-core"
import { ResourceData } from "castmate-schema"
import { OBSConnectionConfig, OBSConnectionState } from "castmate-plugin-obs-shared"

const obs = useResource<ResourceData<OBSConnectionConfig, OBSConnectionState>>("OBSConnection", () => props.obsId)

const openProcess = useResourceIPCCaller<() => any>("OBSConnection", () => props.obsId, "openProcess")

const isLocalObs = computed(() => {
	if (!obs.value) return
	return obs.value.config.host == "127.0.0.1" || obs.value.config.host == "localhost"
})

const props = defineProps<{
	obsId: string | undefined
	overlayConfig: OverlayConfig
}>()

const searching = ref(false)
const sourceName = ref<string>()

const hasSource = computed(() => sourceName.value != null)
const hasError = ref(false)
const hasObs = computed(() => {
	return obs.value?.state?.connected
})

onMounted(() => {
	watch(
		() => props.obsId,
		() => {
			//TODO: Query OBS for browser source that matches URL!
		}
	)
})

function createSourceClick(ev: MouseEvent) {}

function fixErrorsClick(ev: MouseEvent) {}

async function openObs() {
	if (!props.obsId) return
	await openProcess()
}
</script>

<style scoped></style>
