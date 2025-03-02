<template>
	<drop-down-panel
		:container="anchor"
		v-model="dropDown"
		@wheel="stopPropagation"
		@mousedown="onDropdownMouseDown"
		:style="{
			'--media-preview-size': '50px',
			minWidth: `${anchorSize.width.value}px`,
			overflowY: 'auto',
			minHeight: '5rem',
			maxHeight: '15rem',
		}"
	>
		<media-tree-root
			root="default"
			@click="mediaClicked"
			:filter="filter"
			:sound="sound"
			:image="image"
			:video="video"
		>
			<template #noItems>
				<div class="empty-div">CastMate doesn't have any media in it's media folder.</div>
			</template>

			<template #noFiltered> <div class="empty-div">No Media by that name.</div> </template>
		</media-tree-root>
	</drop-down-panel>
</template>

<script setup lang="ts">
import DropDownPanel from "../DropDownPanel.vue"

import MediaTreeRoot from "../../../media/MediaTreeRoot.vue"
import { usePropagationStop } from "../../../../main"
import { MediaFile } from "castmate-schema"
import { useElementSize } from "@vueuse/core"

const stopPropagation = usePropagationStop()

const dropDown = defineModel<boolean>({ default: false })

const props = withDefaults(
	defineProps<{
		anchor: HTMLElement | undefined
		filter?: string
		sound?: boolean
		image?: boolean
		video?: boolean
	}>(),
	{
		sound: false,
		image: false,
		video: false,
	}
)

const emit = defineEmits(["mediaClicked"])

const anchorSize = useElementSize(() => props.anchor)

function onDropdownMouseDown(ev: MouseEvent) {
	if (ev.button != 0) return

	stopPropagation(ev)
	ev.preventDefault()
}

function mediaClicked(media: MediaFile) {
	emit("mediaClicked", media)
}
</script>

<style scoped>
.empty-div {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
}
</style>
