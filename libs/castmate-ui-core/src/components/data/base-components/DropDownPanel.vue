<template>
	<p-portal append-to="body">
		<transition name="p-connected-overlay" @enter="onOverlayEnter">
			<div
				v-if="model"
				ref="overlayDiv"
				v-bind="$attrs"
				class="overlay p-menu p-menu-overlay p-component p-ripple-disabled"
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
import { ref, useModel, nextTick, watch, onBeforeUnmount } from "vue"
import PPortal from "primevue/portal"
import vFocusTrap from "primevue/focustrap"
import { usePrimeVue } from "primevue/config"
import { injectScrollAttachable, positionPortal, stopPropagation, useArtificialScrollAttach } from "../../../main"
import { onClickOutside, useEventListener, useResizeObserver, useScroll } from "@vueuse/core"

import { ZIndex } from "@primeuix/utils/zindex"

defineOptions({
	inheritAttrs: false,
})

const props = withDefaults(
	defineProps<{
		modelValue: boolean
		container: HTMLElement | undefined | null
		side?: "left" | "right"
	}>(),
	{ side: "left" }
)

const model = useModel(props, "modelValue")
const overlayVisibleComplete = ref(false)
const overlayDiv = ref<HTMLElement>()
const primevue = usePrimeVue()

const emit = defineEmits(["mousedown"])

const attachTo = injectScrollAttachable()

useArtificialScrollAttach(
	overlayDiv,
	() => props.container,
	() => props.side
)

function onOverlayEnter() {
	//fixPosition()

	overlayVisibleComplete.value = true
	if (overlayDiv.value) {
		ZIndex.set("overlay", overlayDiv.value, primevue.config.zIndex?.overlay)
	}
}

function fixPosition() {
	positionPortal(overlayDiv.value, props.container, "body", props.side)
}

function mouseDown(ev: MouseEvent) {
	emit("mousedown", ev)
	stopPropagation(ev)
}

watch(model, () => {
	if (!model.value) {
		overlayVisibleComplete.value = false
		if (overlayDiv.value) {
			ZIndex.clear(overlayDiv.value)
		}
	}
})

onBeforeUnmount(() => {
	if (overlayDiv.value) {
		ZIndex.clear(overlayDiv.value)
	}
})

onClickOutside(overlayDiv, (evt) => {
	model.value = false
})
/*
useEventListener(
	() => (overlayVisibleComplete.value ? document : undefined),
	"click",
	(ev) => {
		if (!props.container?.contains(ev.target as Node) && !overlayDiv.value?.contains(ev.target as Node)) {
			model.value = false
		}
	}
)*/
</script>

<style scoped>
.overlay {
	position: absolute;
}
</style>
