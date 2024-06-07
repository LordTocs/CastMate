<template>
	<p-portal :append-to="attachTo">
		<transition name="p-connected-overlay" @enter="onOverlayEnter">
			<div
				v-if="model"
				ref="overlayDiv"
				v-bind="$attrs"
				class="overlay p-dropdown-panel p-component p-ripple-disabled"
				:style="{
					zIndex: primevue.config.zIndex?.overlay,
				}"
				v-focus-trap
				@click="stopPropagation"
				@mousedown="mouseDown"
			>
				<slot></slot>
			</div>
		</transition>
	</p-portal>
</template>

<script setup lang="ts">
import { ref, useModel, nextTick, watch } from "vue"
import PPortal from "primevue/portal"
import vFocusTrap from "primevue/focustrap"
import { usePrimeVue } from "primevue/config"
import { injectScrollAttachable, positionPortal, stopPropagation } from "../../../main"
import { useEventListener, useResizeObserver } from "@vueuse/core"

defineOptions({
	inheritAttrs: false,
})

const props = defineProps<{
	modelValue: boolean
	container: HTMLElement | undefined | null
}>()

const model = useModel(props, "modelValue")
const overlayVisibleComplete = ref(false)
const overlayDiv = ref<HTMLElement | null>(null)
const primevue = usePrimeVue()

const attachTo = injectScrollAttachable()

function onOverlayEnter() {
	fixPosition()

	overlayVisibleComplete.value = true
}

function fixPosition() {
	positionPortal(overlayDiv.value, props.container, attachTo.value)
}

useResizeObserver(overlayDiv, (ev) => {
	nextTick(fixPosition)
})

function mouseDown(ev: MouseEvent) {
	stopPropagation(ev)
	ev.preventDefault()
}

watch(model, () => {
	if (!model.value) {
		overlayVisibleComplete.value = false
	}
})

useEventListener(
	() => (overlayVisibleComplete.value ? document : undefined),
	"click",
	(ev) => {
		if (!props.container?.contains(ev.target as Node) && !overlayDiv.value?.contains(ev.target as Node)) {
			model.value = false
		}
	}
)
</script>

<style scoped>
.overlay {
	position: absolute;
}
</style>
