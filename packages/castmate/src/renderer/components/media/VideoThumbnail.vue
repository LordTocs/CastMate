<template>
<video autoplay muted loop :src="videoFile" v-if="props.play" v-bind="$attrs">
</video>
<img :src="thumbnail" v-else v-bind="$attrs" />
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useIpc } from '../../utils/ipcMap';

const props = defineProps({
    videoFile: { type: String },
    play: { type: Boolean, default: () => false }
})

const thumbnail = ref(null)

const getThumbnail = useIpc("media", "getThumbnail")

async function generateThumbnail() {
    console.log("Generate Thumbnail")
    thumbnail.value = null

    if (!props.videoFile) {
        return
    }
    console.log("Requesting Thumbnail", props.videoFile)
    const thumbnailImage = await getThumbnail(props.videoFile)
    console.log("Got Thumbnail", thumbnailImage)

    thumbnail.value = thumbnailImage
}

watch(() => props.videoFile, () => {
    generateThumbnail()
})

onMounted(() => {
    generateThumbnail()
})


</script>