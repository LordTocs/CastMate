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
		<template #item="{ props, item }">
			<media-list-item :media-file="item.value" @click="props.onClick" />
		</template>

		<template #append>
			<v-btn
				size="x-small"
				variant="tonal"
				icon="mdi-folder"
				@click="openMediaFolder"
			></v-btn>
		</template>
	</v-combobox>
</template>

<script setup>
import { useModel } from "../../../utils/modelValue"
import path from "path"
import { computed, ref } from "vue"
import _union from "lodash/union"
import recursiveReaddir from "recursive-readdir"

import {
	ImageFormats,
	VideoFormats,
	SoundFormats,
} from "../../../utils/filetypes"
import MediaListItem from "../../media/MediaListItem.vue"
import { usePathStore } from "../../../store/paths"
import { shell } from "electron"

const topProps = defineProps({
	schema: {},
	modelValue: {},
	label: { type: String },
	density: { type: String },
})

const pathStore = usePathStore()

const emit = defineEmits(["update:modelValue"])

const modelObj = useModel(topProps, emit)

const mediaPath = computed(() => {
	return path.join(pathStore.userFolder, "media")
})

const extensions = computed(() => {
	let result = []

	if (topProps.schema.image) {
		result = [...ImageFormats]
	}

	if (topProps.schema.video) {
		result = _union(result, VideoFormats)
	}

	if (topProps.schema.sound) {
		result = _union(result, SoundFormats)
	}

	return result
})

const fetching = ref(false)
const files = ref([])

async function onFocus() {
	fetching.value = true
	try {
		files.value = await getFiles()
	} catch (err) {
		console.error(err)
	}
	fetching.value = false
}

async function getFiles() {
	let files = await recursiveReaddir(mediaPath.value)

	//Filter by filetype
	files = files.filter((file) => {
		const ext = path.extname(file).toLowerCase()
		return extensions.value.includes(ext)
	})

	return files.map((file) => path.relative(mediaPath.value, file))
}

function openMediaFolder() {
	shell.openPath(pathStore.mediaFolder)
}
</script>
