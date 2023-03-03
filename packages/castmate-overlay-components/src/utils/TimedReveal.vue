<template>
	<revealer
		:transition="props.transition"
		:animation="props.animation"
		v-show="visible"
	>
		<slot></slot>
	</revealer>
</template>

<script setup>
import { computed, ref,onBeforeUnmount } from "vue"
import Revealer from "./Revealer.vue"
import { isNumber } from "./typeHelpers.js"

const props = defineProps({
	transition: {},
	animation: {},
	appearDelay: { type: Number, default: 0 },
	vanishAdvance: { type: Number, default: 0 },
})

const transitionTime = computed(() => {
	if (!props.transition) return 0
	if (isNumber(props.transition)) return props.transition
	return props.transition.duration
})

const visible = ref(false)

let appearTimeout = null
let dissappearTimeout = null

defineExpose({
	appear(duration) {
		appearTimeout = setTimeout(() => {
			visible.value = true
			appearTimeout = null
		}, props.appearDelay * 1000)

		const beginDissappearing = Math.max(
			0,
			duration - (props.vanishAdvance + transitionTime.value)
		)

		dissappearTimeout = setTimeout(() => {
			visible.value = false
			dissappearTimeout = null;
		}, beginDissappearing * 1000)
	},
})

onBeforeUnmount(() => {
	if (appearTimeout) {
		clearTimeout(appearTimeout)
		appearTimeout = null
	}
	if (dissappearTimeout) {
		clearTimeout(dissappearTimeout)
		dissappearTimeout = null
	}
})
</script>
