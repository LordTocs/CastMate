<template>
<div class="container">

    <video v-if="isVideo" class="fill" ref="video" :muted="isEditor" :src="url"></video>
    <img v-if="isGIF" :src="gifSrc"  ref="gif" class="fill" />
    <div class="content">
        <slot></slot>
    </div>
</div>
</template>


<script setup>
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import path from 'path'

const video = ref(null)
const gif = ref(null)

const isEditor = inject('isEditor')
const mediaFolder = inject('mediaFolder')

const props = defineProps({
    mediaFile: { type: String },
    muted: { type: Boolean, default: () => false}
})

const blankImg = ref(false)

const id = Math.round(Math.random() * 1000)

const url = computed(() => {
    if (!props.mediaFile)
        return undefined

    if (isEditor)
    {
        return `${path.resolve(mediaFolder.value, props.mediaFile)}?id=${id}`
    }
    else
    {
        return `/media/${props.mediaFile}?id=${id}`
    }
})

const gifSrc = computed(() => {
    if (!props.mediaFile)
        return undefined

    if (blankImg.value) {
        console.log("Blanking out the gif")
        return "#"
    }
    return url.value
})

const isGIF = computed(() => {
    if (!props.mediaFile)
        return false;
    const uppercase = props.mediaFile.toUpperCase()

    return uppercase.endsWith('GIF')
})

const isVideo = computed(() => {
    if (!props.mediaFile)
        return false;
    const uppercase = props.mediaFile.toUpperCase()

    return (uppercase.endsWith('WEBM') || uppercase.endsWith('MP4') || uppercase.endsWith('OGG'))
})


defineExpose({
    restart: () => {
        if (isGIF.value && gif.value)
        {
            console.log("Restarting Gif", gif.value.src)
            blankImg.value = true
            nextTick(() => {
                setTimeout(() => {
                    console.log("Gif Restarted: ", gif.value.src)
                    blankImg.value = false
                }, 0)
            })
        }
        else if (isVideo.value && video.value) {
            video.value.pause()
            video.value.currentTime = 0;
            video.value.load()
            video.value.play()
        }
    }
})

</script>

<style scoped>
.container {
    position: relative;
}

.fill {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
}

.content {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
}

</style>