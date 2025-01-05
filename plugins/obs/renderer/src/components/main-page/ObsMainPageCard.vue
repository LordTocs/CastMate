<template>
	<div class="flex flex-column gap-1">
		<main-page-card v-if="noConnections">
			<template #header> <i class="obsi obsi-obs obs-color" /> OBS </template>
			<p-message icon="pi pi-exclamation-triangle" severity="warn" :pt="{ text: 'flex-grow-1' }">
				<div class="flex flex-row w-full gap-1">
					<div class="flex-grow-1 flex flex-column justify-content-center text-center">
						CastMate can control OBS, but you haven't set up the connection yet.
					</div>
					<p-button severity="warn">Setup OBS</p-button>
				</div>
			</p-message>
		</main-page-card>
		<obs-connection-widget v-for="connection in connections" :connection="connection" :key="connection.id" />
	</div>
</template>

<script setup lang="ts">
import { OBSConnectionConfig, OBSConnectionState } from "castmate-plugin-obs-shared"
import { ResourceData } from "castmate-schema"
import { MainPageCard, useResourceArray } from "castmate-ui-core"
import { computed } from "vue"

import PMessage from "primevue/message"
import PButton from "primevue/button"

import ObsConnectionWidget from "./ObsConnectionWidget.vue"

const connections = useResourceArray<ResourceData<OBSConnectionConfig, OBSConnectionState>>("OBSConnection")

const noConnections = computed(() => true) //connections.value.length == 0)
</script>

<style scoped>
.obs-color {
	color: #256eff;
}
</style>
