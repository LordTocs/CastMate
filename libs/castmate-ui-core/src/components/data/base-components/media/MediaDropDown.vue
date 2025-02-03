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
		<div class="media-folder-tree">
			<media-tree
				root="default"
				:files="files"
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
			</media-tree>
		</div>
	</drop-down-panel>
</template>

<script setup lang="ts">
import DropDownPanel from "../DropDownPanel.vue"

import MediaTree from "../../../media/MediaTree.vue"
import { usePropagationStop } from "../../../../main"
import { MediaFile } from "castmate-schema"
import { useElementSize } from "@vueuse/core"

const stopPropagation = usePropagationStop()

const dropDown = defineModel<boolean>({ default: false })

const props = withDefaults(
	defineProps<{
		anchor: HTMLElement | undefined
		files: string[]
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
.media-folder-tree {
	display: grid;
	grid-template-columns: 1fr fit-content(100px) fit-content(150px);
	gap: 0 2px;
	height: 100%;
}

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
