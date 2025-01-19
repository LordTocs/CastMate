<template>
	<data-input v-model="model" :schema="StreamInfoSchema" :local-path="localPath" />
</template>

<script setup lang="ts">
import { StreamInfo, StreamInfoSchema } from "castmate-plugin-twitch-shared"
import { useModel } from "vue"
import { DataInput } from "castmate-ui-core"

const props = defineProps<{
	modelValue: StreamInfo
	localPath: string
}>()

const model = useModel(props, "modelValue")
</script>
