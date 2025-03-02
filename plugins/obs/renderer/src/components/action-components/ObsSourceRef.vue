<template>
	<div class="text-center flex flex-column obs-data-text">
		<template v-if="sourceData">
			<span>{{ scene }}</span>
			<span>{{ sourceData.sourceName }}</span>
		</template>
		<template v-else>
			<span>{{ scene }}</span>
			<span>{{ source }}</span>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computedAsync } from "@vueuse/core"
import { OBSConnectionConfig, OBSConnectionState, OBSWSSceneItem } from "castmate-plugin-obs-shared"
import { ResourceData } from "castmate-schema"
import { defaultStringIsTemplate, useResource, useResourceIPCCaller } from "castmate-ui-core"

const props = defineProps<{
	obs: string | undefined
	scene: string | undefined
	source: number | string | undefined
}>()

const getSceneSource = useResourceIPCCaller<(scene: string, source: number) => OBSWSSceneItem | undefined>(
	"OBSConnection",
	() => props.obs,
	"getSceneSource"
)

const obsResource = useResource<ResourceData<OBSConnectionConfig, OBSConnectionState>>("OBSConnection", () => props.obs)

const sourceData = computedAsync(async () => {
	if (!props.obs) return undefined
	if (!props.scene) return undefined
	if (props.source == null) return undefined
	if (defaultStringIsTemplate(props.scene)) return undefined
	if (defaultStringIsTemplate(props.source) || typeof props.source != "number") return undefined
	if (!obsResource.value?.state.connected) return undefined

	const data = await getSceneSource(props.scene, props.source)
	return data
})
</script>

<style scoped></style>
