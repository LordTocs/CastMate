<template>
	<div class="alert-head" :style="OverlayBlockStyle.toCSSProperties(props.boxConfig?.block)">
		<timed-reveal
			ref="revealer"
			:transition="boxConfig?.transition"
			:appear-delay="boxConfig?.appearDelay"
			:vanish-advance="boxConfig?.vanishAdvance"
		>
			<div
				class="message"
				:style="{
					width: '100%',
					...OverlayTextAlignment.toCSSProperties(props.boxConfig?.textAlign),
					...OverlayTextStyle.toCSSProperties(props.boxConfig?.font),
				}"
			>
				{{ text }}
			</div>
		</timed-reveal>
	</div>
</template>

<script setup lang="ts">
import {
	OverlayBlockStyle,
	OverlayTextAlignment,
	OverlayTextStyle,
	OverlayTransitionAnimation,
} from "castmate-plugin-overlays-shared"
import {
	MediaContainer,
	TimedReveal,
	declareWidgetOptions,
	useIsEditor,
	animationFromTransition,
} from "castmate-overlay-core"
import { ref } from "vue"
import { Duration } from "castmate-schema"

const props = defineProps<{
	boxConfig: {
		font: OverlayTextStyle
		textAlign: OverlayTextAlignment
		block: OverlayBlockStyle
		transition?: OverlayTransitionAnimation
		appearDelay?: Duration
		vanishAdvance?: Duration
	}
	text: string
}>()

const revealer = ref<InstanceType<typeof TimedReveal>>()

defineExpose({
	appear(duration: number) {
		revealer.value?.appear(duration)
	},
})
</script>

<style scoped>
.message {
	white-space: break-spaces;
}
</style>
