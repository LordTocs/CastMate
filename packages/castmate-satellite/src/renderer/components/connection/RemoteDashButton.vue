<template>
	<p-button @click="startConnection"> {{ option.name }}</p-button>
</template>

<script setup lang="ts">
import PButton from "primevue/button"
import { SatelliteConnectionOption } from "castmate-schema"
import { usePluginStore, useSatelliteConnection } from "castmate-ui-core"
import { useChannelAccountResource } from "castmate-plugin-twitch-renderer"

const props = defineProps<{
	option: SatelliteConnectionOption
}>()

const twitchAccount = useChannelAccountResource()

const satelliteStore = useSatelliteConnection()

function startConnection(ev: MouseEvent) {
	if (!twitchAccount.value?.state.authenticated) return

	satelliteStore.connectToCastMate({
		satelliteService: "twitch",
		satelliteId: twitchAccount.value.config.twitchId,
		castmateService: "twitch",
		castmateId: props.option.remoteUserId,
		dashId: props.option.typeId,
	})
}
</script>
