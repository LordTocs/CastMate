<template>
	<div class="fill flex flex-column">
		<div class="connection-band flex flex-column justify-content-center px-2">
			{{ obsResource?.config.name ?? obs }}
		</div>
		<div class="flex-grow-1 flex flex-column align-items-center justify-content-center">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">
import { OBSConnectionConfig, OBSConnectionState } from "castmate-plugin-obs-shared"
import { ResourceData } from "castmate-schema"
import { useResource } from "castmate-ui-core"

const props = defineProps<{
	obs: string | undefined
}>()

//const connections = useResourceArray<ResourceData<OBSConnectionConfig, OBSConnectionState>>("OBSConnection")
const obsResource = useResource<ResourceData<OBSConnectionConfig, OBSConnectionState>>("OBSConnection", () => props.obs)
</script>

<style scoped>
.fill {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	top: 0;
}

.connection-band {
	font-size: 0.6em;
	text-align: center;
	overflow: hidden;
	white-space: nowrap;
	background-color: color-mix(in srgb, var(--darker-action-color) 60%, transparent);
}

:deep(.obs-data-text) {
	font-size: 0.6em;
	text-align: center;
}
</style>
