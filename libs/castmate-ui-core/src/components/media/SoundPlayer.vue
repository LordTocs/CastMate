<template>
	<div>
		<audio :src="file" ref="audioPlayer" @play="onPlay" @pause="onPause"></audio>
		<p-button @click="onClick" :icon="icon"></p-button>
	</div>
</template>

<script setup lang="ts">
import PButton from "primevue/button"
import { computed, ref } from "vue"

const props = defineProps<{
	file: string
}>()

const playing = ref(false)
const icon = computed(() => {
	return playing.value ? "mdi mdi-stop" : "mdi mdi-play"
})

const audioPlayer = ref<HTMLAudioElement | null>(null)

function onPlay() {
	console.log("On Play")
	playing.value = true
}

function onPause() {
	console.log("On Pause")
	playing.value = false
}

function onClick() {
	if (!audioPlayer?.value) return
	if (!playing.value) {
		audioPlayer.value.currentTime = 0
		audioPlayer.value.play()
	} else {
		audioPlayer.value.pause()
	}
}
</script>
