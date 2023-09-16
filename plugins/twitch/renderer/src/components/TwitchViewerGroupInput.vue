<template>
	<div class="p-inputgroup w-full" @mousedown="onMouseDown">
		<div class="p-inputtext" @click="onClick">
			{{ phrase }}
		</div>
		<p-overlay-panel ref="overlay">
			<twitch-viewer-group-edit v-model="model" />
		</p-overlay-panel>
	</div>
</template>

<script setup lang="ts">
import { SchemaTwitchViewerGroup, TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import POverlayPanel from "primevue/overlaypanel"
import TwitchViewerGroupEdit from "./TwitchViewerGroupEdit.vue"
import { useModel, ref, computed } from "vue"
import { useResourceStore } from "castmate-ui-core"
import { getGroupPhrase } from "../util/group"

const props = defineProps<{
	modelValue: TwitchViewerGroup | undefined
	schema: SchemaTwitchViewerGroup
	localPath?: string
}>()

const model = useModel(props, "modelValue")

const overlay = ref<POverlayPanel | null>(null)

function onClick(ev: MouseEvent) {
	overlay.value?.toggle(ev)
}

function onMouseDown(ev: MouseEvent) {
	ev.stopPropagation()
}

const resourceStore = useResourceStore()

const phrase = computed(() => getGroupPhrase(model.value || {}, resourceStore))
</script>

<style scoped>
.group-input {
	min-height: 10rem;
	background-color: red;
}
</style>
