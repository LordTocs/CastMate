<template>
	<div class="container">
		<video v-if="isVideo" class="fill" ref="video" :muted="muted" :src="url"></video>
		<img v-if="isImage" :src="imgSrc" ref="img" class="fill" :style="{ aspectRatio }" />
		<div class="content">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { ImageFormats } from "castmate-schema"
import path from "path"
import { useMediaUrl } from "../util/media-util"
import { useIsEditor } from "../util/editor-util"
import { useEventListener } from "@vueuse/core"

const video = ref<HTMLVideoElement>()
const img = ref<HTMLImageElement>()
const aspectRatio = ref(0)
const blankImg = ref(false)
const isEditor = useIsEditor()

const props = withDefaults(
	defineProps<{
		mediaFile?: string
		muted?: boolean
	}>(),
	{ muted: false }
)

const id = ref(Math.round(Math.random() * 10000))

const mediaUrl = useMediaUrl(() => props.mediaFile)
const url = computed(() => (mediaUrl.value ? `${mediaUrl.value}?=${id.value}` : ""))

const imgSrc = computed(() => {
	if (!props.mediaFile) return undefined

	if (blankImg.value) {
		return "#"
	}
	return url.value
})

const isImage = computed(() => {
	if (!props.mediaFile) return false
	return ImageFormats.includes(path.extname(props.mediaFile.toLowerCase()))
})

const isGIF = computed(() => {
	if (!props.mediaFile) return false
	const uppercase = props.mediaFile.toUpperCase()

	return uppercase.endsWith("GIF")
})

const isVideo = computed(() => {
	if (!props.mediaFile) return false
	const uppercase = props.mediaFile.toUpperCase()

	return uppercase.endsWith("WEBM") || uppercase.endsWith("MP4") || uppercase.endsWith("OGG")
})

onMounted(() => {
	watch(
		() => props.mediaFile,
		() => {
			console.log("Media Container", props.mediaFile)
		},
		{ immediate: true }
	)
})

useEventListener(video, "loadedmetadata", () => {
	if (!video.value) return

	console.log("Video Info Loaded", video.value.videoWidth, video.value.videoHeight)
	aspectRatio.value = video.value.videoWidth / video.value.videoHeight
})

useEventListener(img, "load", () => {
	if (!img.value) return

	console.log("Image Data Loaded", img.value.naturalWidth, img.value.naturalHeight)
	aspectRatio.value = img.value.naturalWidth / img.value.naturalHeight
})

defineExpose({
	restart() {
		if (isGIF.value && img.value) {
			blankImg.value = true
			//Wait for the next v-dom tick so blankImg's value is updated in the render
			nextTick(() => {
				//Wait for the next dom render so we're guarenteed the img has been rendered without a src
				window.requestAnimationFrame(() => {
					blankImg.value = false
				})
			})
		} else if (isVideo.value && video.value) {
			//video.value.pause()
			video.value.currentTime = 0
			video.value.load()
			if (video.value.paused) {
				try {
					video.value.play()
				} catch (err) {
					//Sometimes it throws exceptions when trying to play while the app is minimized.
					//We don't really need to do anything to handle it, but we don't want the exception to bubble.
				}
			}
		}
	},
})
</script>

<style scoped>
.container {
	position: relative;
}

.fill {
	position: absolute;
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.content {
	position: relative;
}
</style>
