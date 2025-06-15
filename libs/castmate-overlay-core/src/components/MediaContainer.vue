<template>
	<div class="container">
		<video v-if="isVideo" class="fill" ref="video" :muted="muted" :src="url" @canplay="videoCanPlay"></video>
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
import { useEventListener } from "@vueuse/core"

const video = ref<HTMLVideoElement>()
const img = ref<HTMLImageElement>()
const aspectRatio = ref(0)
const blankImg = ref(false)

const props = withDefaults(
	defineProps<{
		mediaFile?: string
		muted?: boolean
	}>(),
	{ muted: false }
)

const id = ref(Math.round(Math.random() * 10000))

const url = useMediaUrl(() => props.mediaFile)
const uniqueUrl = computed(() => (url.value ? `${url.value}?=${id.value}` : ""))
const needsLoad = ref(true)
const needsPlay = ref(false)

const imgSrc = computed(() => {
	if (!props.mediaFile) return undefined

	if (blankImg.value) {
		return "#"
	}
	return uniqueUrl.value
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
			needsLoad.value = true
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

function videoCanPlay(ev: Event) {
	if (!video.value) return

	//console.log("video can play", needsPlay.value, video.value.readyState)
	if (needsPlay.value) {
		needsPlay.value = false
		try {
			//console.log("Seeking 0")
			video.value.currentTime = 0
			if (video.value.paused) {
				//console.log("Playing")
				video.value?.play()
			}
		} catch (err) {
			console.error(err)
			//Sometimes it throws exceptions when trying to play while the app is minimized.
			//We don't really need to do anything to handle it, but we don't want the exception to bubble.
		}
	}
}

defineExpose({
	restart() {
		//console.log("Restart()", props.mediaFile, isGIF.value, isVideo.value)
		if (isGIF.value) {
			blankImg.value = true
			//Wait for the next v-dom tick so blankImg's value is updated in the render
			nextTick(() => {
				//Wait for the next dom render so we're guarenteed the img has been rendered without a src
				window.requestAnimationFrame(() => {
					blankImg.value = false
				})
			})
		} else if (isVideo.value) {
			if (!video.value) {
				console.error("Tried to play with no video")
				return
			}

			console.log("Starting Video Restart")
			needsPlay.value = true

			//video.value.pause()
			if (needsLoad.value) {
				//console.log("Loading Video")
				video.value.load()
				needsLoad.value = false
			}

			if (video.value.readyState >= 3) {
				//console.log("Video is Ready")
				needsPlay.value = false
				//console.log("Seeking 0")
				video.value.currentTime = 0

				if (video.value.paused) {
					//console.log("Video needs play()")
					try {
						video.value.play()
					} catch (err) {
						console.error(err)
						//Sometimes it throws exceptions when trying to play while the app is minimized.
						//We don't really need to do anything to handle it, but we don't want the exception to bubble.
					}
				} else {
					//console.log("Video Already Playing")
				}
			} else {
				//console.log("Video not ready!", video.value.readyState)
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
