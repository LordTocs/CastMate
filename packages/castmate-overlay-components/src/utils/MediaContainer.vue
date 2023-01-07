<template>
<div class="container">

    <video v-if="isVideo" class="fill" ref="video" :muted="isEditor" :src="url"></video>
    <img v-if="isImage" :src="imgSrc"  ref="img" class="fill" />
    <div class="content">
        <slot></slot>
    </div>
</div>
</template>


<script setup>
import { computed, inject, nextTick, ref } from 'vue'
import { ImageFormats, VideoFormats } from './filetypes.js'
import path from 'path'

const video = ref(null)
const img = ref(null)

const isEditor = inject('isEditor')
const mediaFolder = inject('mediaFolder')

const props = defineProps({
    mediaFile: { type: String },
    muted: { type: Boolean, default: () => false}
})

const blankImg = ref(false)

const id = Math.round(Math.random() * 10000)

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

const imgSrc = computed(() => {
    if (!props.mediaFile)
        return undefined

    if (blankImg.value) {
        return "#"
    }
    return url.value
})

const isImage = computed(() => {
    if (!props.mediaFile)
        return false;
    return ImageFormats.includes(path.extname(props.mediaFile.toLowerCase()))
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
        if (isGIF.value && img.value)
        {
            blankImg.value = true
            //Wait for the next v-dom tick so blankImg's value is updated in the render
            nextTick(() => {
                //Wait for the next dom render so we're guarenteed the img has been rendered without a src
                window.requestAnimationFrame(() => {
                    blankImg.value = false
                })
            })
        }
        else if (isVideo.value && video.value) {
            
            //video.value.pause()
            video.value.currentTime = 0;
            video.value.load()
            if (video.value.paused)
            {
                try {
                    video.value.play()
                }
                catch(err)
                {
                    //Sometimes it throws exceptions when trying to play while the app is minimized.
                    //We don't really need to do anything to handle it, but we don't want the exception to bubble.
                }
            }
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
    object-fit: contain;
}

.content {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
}

</style>