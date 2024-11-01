<template>
	<div>
		<data-input v-model="model" :schema="editSchema" />
	</div>
</template>

<script setup lang="ts">
import { declareSchema } from "castmate-schema"
import { DataInput, provideScrollAttachable, useDialogRef } from "castmate-ui-core"
import { TwitchViewer, TwitchViewerUnresolved } from "castmate-plugin-twitch-shared"
import { onMounted, ref, useModel } from "vue"

const editSchema = declareSchema({
	type: Array,
	name: "Shared Viewers",
	items: {
		type: TwitchViewer,
		required: true,
	},
	required: true,
})

const props = defineProps<{
	modelValue: TwitchViewerUnresolved[]
}>()

const model = useModel(props, "modelValue")
</script>

<style scoped></style>
