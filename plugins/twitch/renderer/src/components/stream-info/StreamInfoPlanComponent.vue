<template>
	<data-input v-model="model" :schema="StreamInfoSchema" />
</template>

<script setup lang="ts">
import { StreamInfo, StreamInfoSchema } from "castmate-plugin-twitch-shared"
import { useModel } from "vue"
import { DataInput } from "castmate-ui-core"

const props = defineProps<{
	modelValue: StreamInfo
}>()

const model = useModel(props, "modelValue")
</script>
