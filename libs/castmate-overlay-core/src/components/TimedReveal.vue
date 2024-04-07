<template>
	<revealer :transition="transitionTime" :animation="animation" v-show="visible">
		<slot></slot>
	</revealer>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from "vue"
import Revealer from "./Revealer.vue"
import { RevealAnimation, animationFromTransition } from "../util/animation-util"
import { OverlayTransitionAnimation } from "castmate-plugin-overlays-shared"

const props = withDefaults(
	defineProps<{
		transition?: OverlayTransitionAnimation
		appearDelay?: number
		vanishAdvance?: number
	}>(),
	{
		appearDelay: 0,
		vanishAdvance: 0,
	}
)

const transitionTime = computed(() => {
	return props.transition?.duration ?? 0
})

const animation = computed(() => animationFromTransition(props.transition))

const visible = ref(false)

let appearTimeout: NodeJS.Timeout | undefined = undefined
let dissappearTimeout: NodeJS.Timeout | undefined = undefined

function clearTimeouts() {
	if (appearTimeout) {
		clearTimeout(appearTimeout)
		appearTimeout = undefined
	}
	if (dissappearTimeout) {
		clearTimeout(dissappearTimeout)
		dissappearTimeout = undefined
	}
}

defineExpose({
	appear(duration: number) {
		clearTimeouts()
		appearTimeout = setTimeout(() => {
			visible.value = true
			appearTimeout = undefined
		}, props.appearDelay * 1000)

		const beginDisappearing = Math.max(0, duration - (props.vanishAdvance + transitionTime.value))

		dissappearTimeout = setTimeout(() => {
			visible.value = false
			dissappearTimeout = undefined
		}, beginDisappearing * 1000)
	},
})

onBeforeUnmount(() => {
	clearTimeouts()
})
</script>
