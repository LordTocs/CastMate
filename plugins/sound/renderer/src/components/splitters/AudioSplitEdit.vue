<template>
	<div class="redirect-card" :class="{ selected: isSelected, muted: isMuted }">
		<div class="redirect-card-body" @mousedown="stopPropagation">
			<c-toggle-button
				v-model="model.mute"
				local-path="mute"
				on-severity="danger"
				on-icon="mdi mdi-volume-mute"
				off-icon="mdi mdi-volume-high"
			/>
			<div class="data-section flex-grow-1 px-1 py-3">
				<data-input :schema="redirectSchema" v-model="model" />
			</div>
			<p-button icon="mdi mdi-delete" @click="deleteMe"></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { AudioSplit } from "castmate-plugin-sound-shared"
import { AudioSplitView } from "./splitter-types"
import { computed } from "vue"
import { ResourceProxyFactory, useDataBinding, usePropagationStop, DataInput, CToggleButton } from "castmate-ui-core"
import PButton from "primevue/button"
import { declareSchema } from "castmate-schema"

const model = defineModel<AudioSplit>({ required: true })
const view = defineModel<AudioSplitView>("view", { required: true })

const props = defineProps<{
	selectedIds: string[]
	localPath: string
}>()

const emit = defineEmits(["delete"])

const redirectSchema = declareSchema({
	type: Object,
	properties: {
		output: { type: ResourceProxyFactory, resourceType: "SoundOutput", name: "Output" },
		volume: { type: Number, name: "Volume", slider: true, min: 0, max: 100 },
	},
})

const stopPropagation = usePropagationStop()

useDataBinding(() => props.localPath)

const isSelected = computed(() => {
	return props.selectedIds.includes(model.value.id)
})

const isMuted = computed(() => {
	return model.value.mute
})

function deleteMe() {
	emit("delete")
}
</script>

<style scoped>
.redirect-card {
	border: 2px solid var(--surface-b);
	border-radius: var(--border-radius);
	background-color: var(--surface-a);

	display: flex;
	flex-direction: column;
}

.redirect-card.muted {
	border-color: red;
}

.redirect-card.selected {
	border: 2px solid white;
}

.redirect-card-header {
	background-color: var(--surface-c);
	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);

	display: flex;
	flex-direction: row;
}

.redirect-card-body {
	display: flex;
	flex-direction: row;
}
</style>
