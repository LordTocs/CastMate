<template>
	<b>{{ getCommandInfoString(config.command) }}</b>
</template>

<script setup lang="ts">
import { Command, getCommandInfoString } from "castmate-schema"

const props = defineProps<{
	config: {
		command: Command
	}
}>()
</script>
