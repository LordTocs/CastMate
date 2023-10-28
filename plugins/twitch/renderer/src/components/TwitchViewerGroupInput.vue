<template>
	<div class="tvg-input p-inputgroup" @mousedown="stopPropagation" ref="container">
		<div class="p-inputtext" @click="onClick">
			{{ phrase }}
		</div>
		<drop-down-panel :container="container" v-model="overlayVisible">
			<twitch-viewer-group-edit v-model="model" />
		</drop-down-panel>
	</div>
</template>

<script setup lang="ts">
import { SchemaTwitchViewerGroup, TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import TwitchViewerGroupEdit from "./TwitchViewerGroupEdit.vue"
import { useModel, ref, computed } from "vue"
import { stopPropagation, useResourceStore, DropDownPanel } from "castmate-ui-core"
import { getGroupPhrase } from "../util/group"

const props = defineProps<{
	modelValue: TwitchViewerGroup | undefined
	schema: SchemaTwitchViewerGroup
	localPath?: string
}>()

const model = useModel(props, "modelValue")

const resourceStore = useResourceStore()
const phrase = computed(() => getGroupPhrase(model.value || {}, resourceStore))

const container = ref<HTMLElement>()

const overlayVisible = ref(false)
function toggle() {
	if (overlayVisible.value) {
		overlayVisible.value = false
	} else {
		overlayVisible.value = true
	}
}

function onClick(ev: MouseEvent) {
	toggle()
	ev.stopPropagation()
	ev.preventDefault()
}
</script>

<style scoped>
.tvg-input {
	position: relative;
}

.overlay {
	border-radius: var(--border-radius);
}
</style>
