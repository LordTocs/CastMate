<template>
	<svg viewBox="0 0 1 1" preserveAspectRatio="none" class="waveform" ref="waveformContainer">
		<path :d="waveSvg" fill="currentColor" />
	</svg>
</template>

<script setup lang="ts">
import { MediaMetadata } from "castmate-schema"
import { MaybeRefOrGetter, computed, onMounted, ref, shallowRef, toValue, watch } from "vue"
import * as fs from "fs/promises"
import { MediaFile } from "castmate-schema"
import { useMediaStore } from "castmate-ui-core"
import { useElementSize } from "@vueuse/core"
const props = defineProps<{
	modelValue: { sound: MediaFile }
}>()

const waveformContainer = ref<HTMLElement | null>(null)
const containerSize = useElementSize(waveformContainer)

const mediaStore = useMediaStore()

async function getAudioData(media: MediaMetadata) {
	const context = new AudioContext()

	const filedata = await fs.readFile(media.file)

	const data = await context.decodeAudioData(filedata.buffer)

	const channelData: Array<Float32Array> = []

	for (let i = 0; i < Math.min(data.numberOfChannels, 2); ++i) {
		channelData.push(data.getChannelData(i))
	}

	return channelData
}

function useAudioData(media: MaybeRefOrGetter<MediaMetadata>) {
	const data = shallowRef<Array<Float32Array>>([])

	async function refreshData() {
		const mediaMetadata = toValue(media)
		if (!mediaMetadata) {
			data.value = []
		} else {
			data.value = await getAudioData(mediaMetadata)
		}
	}
	watch(media, refreshData)
	onMounted(refreshData)

	return data
}

const audioMetaData = computed(() => {
	return mediaStore.media[props.modelValue.sound]
})
const audioData = useAudioData(audioMetaData)

const waveSvg = computed(() => {
	let result = "M 0,0.5" //Start on the left halfway

	const topData = audioData.value[0]
	const bottomData = audioData.value[1] ?? audioData.value[0]

	if (!topData || !audioMetaData.value?.duration) {
		result += " Z"
		return result
	}

	const sampleCount = Math.floor(500 * audioMetaData.value.duration) //TODO, make better?

	//First the top
	const strideTop = topData.length / sampleCount
	for (let i = 0; i < sampleCount; i++) {
		const sample = topData[Math.floor(i * strideTop)]

		const x = i / sampleCount
		const y = (1.0 - sample) / 2

		result += ` L ${x}, ${y}`
	}

	//Then the bottom in reverse
	const strideBottom = bottomData.length / sampleCount
	for (let i = sampleCount - 1; i >= 0; i--) {
		const sample = bottomData[Math.floor(i * strideBottom)] //TODO: Average multiple samples??

		const x = i / sampleCount
		const y = 0.5 + sample / 2
		result += ` L ${x}, ${y}`
	}

	result += " Z"

	return result
})
</script>

<style scoped>
.waveform {
	color: var(--darkest-action-color);
}
</style>
