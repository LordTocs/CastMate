<template>
	<main-page-card>
		<template #header> <i class="mdi mdi-twitch twitch-purple" /> Twitch Info </template>
		<data-input v-model="model" :schema="StreamInfoSchema" :local-path="localPath" />
	</main-page-card>
</template>

<script setup lang="ts">
import { StreamInfo, StreamInfoSchema } from "castmate-plugin-twitch-shared"
import { useModel } from "vue"
import { DataInput, MainPageCard } from "castmate-ui-core"

const props = defineProps<{
	modelValue: StreamInfo
	localPath: string
}>()

const model = useModel(props, "modelValue")
</script>
