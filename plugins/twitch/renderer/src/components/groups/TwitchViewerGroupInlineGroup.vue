<template>
	<div class="inline-group p-1">
		<div class="inline-group-header flex flex-row mb-5">
			<p-button text size="small" @click="model.userIds.push('')"><i class="mdi mdi-plus" />Viewer</p-button>
			<div class="flex-grow-1"></div>
			<p-button
				text
				size="small"
				:icon="excluded ? 'mdi mdi-equal' : 'mdi mdi-not-equal-variant'"
				@click="excluded = !excluded"
			></p-button>
			<p-button text size="small" icon="mdi mdi-delete" @click="emit('delete')"></p-button>
		</div>
		<div class="flex flex-row mt-4" v-for="(viewer, i) in model.userIds">
			<data-input :schema="viewerSchema" v-model="model.userIds[i]" class="flex-grow-1 flex-grow-0 w-0" />
			<p-button text size="small" icon="mdi mdi-delete" @click="model.userIds.splice(i, 1)"></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { TwitchViewer, TwitchViewerGroupInlineList } from "castmate-plugin-twitch-shared"

import { useModel } from "vue"
import { DataInput } from "castmate-ui-core"
import PButton from "primevue/button"
import { declareSchema } from "castmate-schema"

const props = defineProps<{
	modelValue: TwitchViewerGroupInlineList
	excluded: boolean
}>()

const model = useModel(props, "modelValue")
const excluded = useModel(props, "excluded")
const emit = defineEmits(["delete"])

const viewerSchema = declareSchema({
	type: TwitchViewer,
	required: true,
	name: "Viewer",
})
</script>

<style scoped>
.inline-group {
	border-radius: var(--border-radius);
	border: solid 1px var(--surface-d);
}

.excluded > * > .inline-group {
	border-color: red;
	border-top-left-radius: 0;
	border-bottom-left-radius: 0;
}
</style>
