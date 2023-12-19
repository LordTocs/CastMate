<template>
	<div class="p-inputgroup" @mousedown="stopPropagation" ref="container">
		<label-floater :label="schema.name" :no-float="noFloat" input-id="media" v-slot="labelProps">
			<input-box :model="model" v-bind="labelProps" @click="onClick" :placeholder="schema.name">
				{{ selectedMedia?.name ?? model }}
			</input-box>
		</label-floater>
		<drop-down-panel
			:container="container"
			v-model="dropDown"
			:style="{
				'--media-preview-size': '50px',
				minWidth: `${containerSize.width.value}px`,
				overflowY: 'auto',
				maxHeight: '15rem',
			}"
			@wheel="stopPropagation"
		>
			<table style="width: 100%">
				<tr>
					<th>Media</th>
					<th>Type</th>
					<th>Duration</th>
				</tr>
				<media-tree root="default" :files="mediaItems.map((i) => i.path)" @click="mediaClicked" />
			</table>
		</drop-down-panel>
	</div>
</template>

<script setup lang="ts">
import { SchemaMediaFile, SchemaBase } from "castmate-schema"
import { computed, ref, useModel } from "vue"
import { FilterMatchMode } from "primevue/api"
import { DropDownPanel, stopPropagation, useMediaStore } from "../../../main"
import { MediaMetadata } from "castmate-schema"
import { SharedDataInputProps } from "../DataInputTypes"

import MediaTree from "../../media/MediaTree.vue"
import LabelFloater from "../base-components/LabelFloater.vue"
import InputBox from "../base-components/InputBox.vue"
import { useElementSize } from "@vueuse/core"
import { MediaFile } from "castmate-schema"

const props = defineProps<
	{
		schema: SchemaMediaFile & SchemaBase
		modelValue: string | undefined
	} & SharedDataInputProps
>()

const mediaStore = useMediaStore()
const mediaItems = computed(() =>
	Object.values(mediaStore.media)
		.filter((m) => {
			if (props.schema.image && !m.image) return false
			if (props.schema.sound && !m.audio) return false
			if (props.schema.video && !m.video) return false
			return true
		})
		.sort((a, b) => a.path.localeCompare(b.path))
)

const container = ref<HTMLElement>()
const containerSize = useElementSize(container)
const dropDown = ref(false)

const model = useModel(props, "modelValue")

const selectedMedia = computed({
	get() {
		if (!props.modelValue) return undefined
		return mediaStore.media[props.modelValue]
	},
	set(v: MediaMetadata | undefined) {
		model.value = v?.path
	},
})

function onSelect() {
	dropDown.value = false
}

function onClick(ev: MouseEvent) {
	if (ev.button != 0) return

	ev.stopPropagation()
	ev.preventDefault()
	dropDown.value = true
}

function mediaClicked(media: MediaFile) {
	model.value = media
	dropDown.value = false
}
</script>
