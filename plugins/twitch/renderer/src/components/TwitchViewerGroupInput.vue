<template>
	<div class="tvg-input p-inputgroup" @mousedown="stopPropagation" ref="container">
		<div class="p-inputtext" @click="onClick">
			{{ phrase }}
		</div>
		<p-portal :append-to="attachTo">
			<transition name="p-connected-overlay" @enter="onOverlayEnter">
				<div
					v-if="overlayVisible"
					class="overlay p-dropdown-panel p-component p-ripple-disabled p-1"
					ref="overlayDiv"
					v-focus-trap
					:style="{
						zIndex: primevue.config.zIndex?.overlay,
					}"
					@mousedown="stopPropagation"
					@click="stopPropagation"
				>
					<twitch-viewer-group-edit v-model="model" />
				</div>
			</transition>
		</p-portal>
	</div>
</template>

<script setup lang="ts">
import { SchemaTwitchViewerGroup, TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import PPortal from "primevue/portal"
import vFocusTrap from "primevue/focustrap"
import TwitchViewerGroupEdit from "./TwitchViewerGroupEdit.vue"
import { useModel, ref, computed, watch, nextTick } from "vue"
import { injectScrollAttachable, positionPortal, stopPropagation, useResourceStore } from "castmate-ui-core"
import { getGroupPhrase } from "../util/group"
import { usePrimeVue } from "primevue/config"
import { useElementSize, useEventListener } from "@vueuse/core"
import { DomHandler } from "primevue/utils"

const props = defineProps<{
	modelValue: TwitchViewerGroup | undefined
	schema: SchemaTwitchViewerGroup
	localPath?: string
}>()

const model = useModel(props, "modelValue")

const resourceStore = useResourceStore()
const phrase = computed(() => getGroupPhrase(model.value || {}, resourceStore))

const primevue = usePrimeVue()
const container = ref<HTMLElement | null>(null)
const overlayDiv = ref<HTMLElement | null>(null)

const overlayVisible = ref(false)
const overlayVisibleComplete = ref(false)

function show() {
	if (!overlayVisible.value) {
		overlayVisible.value = true
	}
}
function hide() {
	overlayVisible.value = false
	overlayVisibleComplete.value = false
}
function toggle() {
	if (overlayVisible.value) {
		hide()
	} else {
		show()
	}
}

function onClick(ev: MouseEvent) {
	toggle()
	ev.stopPropagation()
	ev.preventDefault()
}

const attachTo = injectScrollAttachable()

function fixPos() {
	if (!overlayDiv.value) return
	if (!container.value) return
	//DomHandler.relativePosition(overlayDiv.value, container.value)
	//DomHandler.absolutePosition(overlayDiv.value, container.value)
	positionPortal(overlayDiv.value, container.value, attachTo.value)
}

function onOverlayEnter() {
	if (!overlayDiv.value) return
	if (!container.value) return

	overlayVisibleComplete.value = true

	fixPos()
}

const overlaySize = useElementSize(overlayDiv)

watch(
	() => overlaySize.height,
	() => {
		if (overlayVisibleComplete.value) {
			nextTick(() => {
				fixPos()
			})
		}
	},
	{ deep: true }
)

useEventListener(
	() => (overlayVisibleComplete.value ? document : undefined),
	"click",
	(ev) => {
		console.log("Outside Click!", ev.target)
		if (!container.value?.contains(ev.target as Node) && !overlayDiv.value?.contains(ev.target as Node)) {
			hide()
		}
	}
)
</script>

<style scoped>
.tvg-input {
	position: relative;
}

.overlay {
	border-radius: var(--border-radius);
}
</style>
