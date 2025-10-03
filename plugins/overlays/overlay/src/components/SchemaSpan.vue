<template>
	<span v-if="schema.type == Duration">{{ formatDuration(value, 2) }}</span>
	<span v-else>{{ value }}</span>
</template>

<script setup lang="ts">
//In dire need of a refactor.

//In 0.6 we should be unifying IPC, Websocket, and WebRTC bridges and moving View components to a non ui-core package.

import { Duration, formatDuration, Schema } from "castmate-schema"

const props = defineProps<{
	value: any
	schema: Schema
}>()
</script>
