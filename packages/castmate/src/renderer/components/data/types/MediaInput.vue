<template>
    <v-combobox 
        v-model="modelObj"
        :items="files"
        :loading="fetching"
        clearable
        @focus="onFocus"
        :density="topProps.density"
        :label="label"
    >
        <template #item="{props, item}">
            <media-list-item :media-file="item.value" @click="props.onClick" />
        </template>
    </v-combobox>
</template>

<script setup>
import { useModel } from '../../../utils/modelValue'
import path from "path"
import { useStore } from 'vuex';
import { computed, ref } from 'vue';
import _union from 'lodash/union'
import recursiveReaddir from "recursive-readdir"

import { ImageFormats, VideoFormats, SoundFormats } from '../../../utils/filetypes';
import MediaListItem from '../../media/MediaListItem.vue';

const topProps = defineProps({
    schema: {},
    modelValue: {},
    label: { type: String },
    density: { type: String }
})

const store = useStore()

const emit = defineEmits(['update:modelValue'])

const modelObj = useModel(topProps, emit);

const userFolder = computed(() => {
    return store.getters['ipc/paths'].userFolder
})

const mediaPath = computed(() => { 
    return path.join(userFolder.value, "media")
})

const extensions = computed(() => {
    let result = [];

    if (topProps.schema.image) {
        result = [...ImageFormats]
    }

    if (topProps.schema.video) {
        result = _union(result, VideoFormats)
    }

    if (topProps.schema.sound) {
        result = _union(result, SoundFormats)
    }

    return result;
})

const fetching = ref(false)
const files = ref([])

async function onFocus() {
    fetching.value = true
    try {
        files.value = await getFiles()
    }
    catch(err) {
        console.error(err);
    }
    fetching.value = false
}

async function getFiles() {
    let files = await recursiveReaddir(mediaPath.value);

    //Filter by filetype
    files = files.filter((file) => {
        const ext = path.extname(file).toLowerCase()
        return extensions.value.includes(ext)
    })

    return files.map((file) => path.relative(mediaPath.value, file));
}


</script>