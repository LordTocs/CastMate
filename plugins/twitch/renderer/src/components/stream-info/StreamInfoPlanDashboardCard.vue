<template>
	<div class="text-center mt-2">
		<data-view :schema="StreamInfoSchema" :model-value="props.config" no-label class="flex flex-column gap-2" />
	</div>
</template>

<script setup lang="ts">
import { StreamInfo, StreamInfoSchema } from "castmate-plugin-twitch-shared"
import { DataView } from "castmate-ui-core"

const props = defineProps<{
	config: StreamInfo
}>()
</script>
