<template>
	<div class="wave-wrapper">
		<div class="sound-label">{{ modelValue.sound ? path.basename(modelValue.sound) : "" }}</div>
		<svg :viewBox="viewBox" preserveAspectRatio="none" class="waveform" ref="waveformContainer">
			<path :d="waveSvg" fill="currentColor" />
		</svg>
	</div>
</template>

<script setup lang="ts">
import { MediaMetadata } from "castmate-schema"
import { MaybeRefOrGetter, computed, onMounted, ref, shallowRef, toValue, watch } from "vue"
import * as fs from "fs/promises"
import { MediaFile } from "castmate-schema"
import { useMediaStore } from "castmate-ui-core"
import { useElementSize } from "@vueuse/core"
import { Duration } from "castmate-schema"
import path from "path"

const props = defineProps<{
	modelValue: { sound: MediaFile; startTime?: Duration; endTime?: Duration }
}>()

const waveformContainer = ref<HTMLElement | null>(null)

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

const viewBox = computed(() => {
	if (!audioMetaData.value?.duration) {
		return "0 0 1 1"
	}

	const startTime = props.modelValue.startTime ?? 0
	const endTime = props.modelValue.endTime ?? audioMetaData.value.duration

	const startPercent = startTime / audioMetaData.value.duration
	const endPercent = endTime / audioMetaData.value.duration

	return `${startPercent} 0 ${endPercent - startPercent} 1`
})

const waveSvg = computed(() => {
	let result = "M 0,0.5" //Start on the left halfway

	const topData = audioData.value[0]
	const bottomData = audioData.value[1] ?? audioData.value[0]

	if (!topData || !audioMetaData.value?.duration) {
		result += " Z"
		return result
	}

	//Set a max length to for generating samples incase EXTRA long sounds get loaded.
	const sampleCount = Math.floor(500 * Math.min(audioMetaData.value.duration, 30)) //TODO, make better?

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
.wave-wrapper {
	overflow: hidden;
}

.waveform {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	color: var(--darkest-action-color);
}

.sound-label {
	padding: 0 0.25rem;
	font-size: 0.7rem;
}
</style>
