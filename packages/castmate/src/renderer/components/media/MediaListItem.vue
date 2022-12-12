<template>
    <v-list-item :active="active" @mouseover="(hover = true)" @mouseleave="(hover = false)">
        <template #prepend>
            <v-icon icon="mdi-volume-high" v-if="isSound" />
            <img :src="fullMediaFilePath" class="preview-img" v-else-if="isImage" />
            <video-thumbnail class="preview-img" :video-file="fullMediaFilePath" :play="hover" v-else-if="isVideo" />
        </template>
        <v-list-item-title> {{mediaName}} </v-list-item-title>
    </v-list-item>
</template>

<script setup>
import { computed, onMounted, useAttrs, watch, ref } from 'vue';
import path from 'path'
import { ImageFormats, SoundFormats, VideoFormats } from '../../utils/filetypes';
import VideoThumbnail from './VideoThumbnail.vue';
import { useStore } from 'vuex';


const props = defineProps({
    mediaFile: { type: String },
    active: { type: Boolean }
})

const store = useStore()

const hover = ref(false)

const mediaFolder = computed(() => {
    if (!props.mediaFile)
        return null
    return path.dirname(props.mediaFile)
})

const mediaName = computed(() => {
    if (!props.mediaFile)
        return null
    return path.basename(props.mediaFile)
})

const isImage = computed(() => {
    if (!props.mediaFile)
        return false;
    const ext = path.extname(props.mediaFile).toLowerCase()
    return ImageFormats.includes(ext)
})

const isSound = computed(() => {
    if (!props.mediaFile)
        return false;
    const ext = path.extname(props.mediaFile).toLowerCase()
    return SoundFormats.includes(ext)
})

const isVideo = computed(() => {
    if (!props.mediaFile)
        return false;
    const ext = path.extname(props.mediaFile).toLowerCase()
    return VideoFormats.includes(ext)
})

const fullMediaFilePath = computed(() => {
    if (!props.mediaFile)
        return null;
    return path.join(store.getters['ipc/paths'].userFolder, "media", props.mediaFile)
})

const attrs = useAttrs();


watch(() => props.active, () => { 
    console.log("Active", props.active, attrs)
})


onMounted(() => {
    console.log("attrs", props.active, attrs)
})


</script>

<style scoped>
.preview-img {
    max-height: 40px; /* Is this right */
    max-width: 40px;
}
</style>