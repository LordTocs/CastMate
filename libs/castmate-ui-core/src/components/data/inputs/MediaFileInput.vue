<template>
	<data-input-base v-model="model" :schema="schema" :no-float="noFloat" v-slot="inputProps">
		<div class="container w-full" ref="container">
			<input-box v-if="!focused" :model="model" v-bind="inputProps" :tab-index="-1" @focus="onFocus">
				{{ selectedMedia?.name ?? model }}
			</input-box>
			<p-input-text
				v-else
				@blur="onBlur"
				class="p-dropdown-label query-input"
				ref="filterInputElement"
				v-model="filterValue"
				@keydown="onFilterKeyDown"
				v-bind="inputProps"
			/>
		</div>
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
			@mousedown="onDropdownMouseDown"
		>
			<div class="media-folder-tree">
				<media-tree
					root="default"
					:files="mediaItems.map((i) => i.path)"
					@click="mediaClicked"
					:filter="filterValue"
				/>
			</div>
		</drop-down-panel>
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"

import { SchemaMediaFile, SchemaBase } from "castmate-schema"
import { computed, nextTick, ref, useModel } from "vue"
import { FilterMatchMode } from "primevue/api"
import { DropDownPanel, useMediaStore, usePropagationStop } from "../../../main"
import { MediaMetadata } from "castmate-schema"
import { SharedDataInputProps } from "../DataInputTypes"

import MediaTree from "../../media/MediaTree.vue"
import LabelFloater from "../base-components/LabelFloater.vue"
import InputBox from "../base-components/InputBox.vue"
import { useElementSize } from "@vueuse/core"
import { MediaFile } from "castmate-schema"
import PInputText from "primevue/inputtext"

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

const focused = ref(false)
function onFocus(ev: FocusEvent) {
	focused.value = true

	dropDown.value = true
	filterValue.value = ""

	nextTick(() => {
		filterInputElement.value?.$el?.focus()
	})
}
function onBlur(ev: FocusEvent) {
	focused.value = false
}

const filterValue = ref<string>("")
const filterInputElement = ref<{ $el: HTMLElement } | null>(null)

function onFilterKeyDown(ev: KeyboardEvent) {
	//dropDown.value?.handleKeyEvent(ev)
}

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

const stopPropagation = usePropagationStop()

function onSelect() {
	dropDown.value = false
}

function onDropdownMouseDown(ev: MouseEvent) {
	if (ev.button != 0) return

	stopPropagation(ev)
	ev.preventDefault()
}

function onClick(ev: MouseEvent) {
	if (ev.button != 0) return

	stopPropagation(ev)
	ev.preventDefault()
	dropDown.value = true
}

function mediaClicked(media: MediaFile) {
	model.value = media
	dropDown.value = false
	focused.value = false
}
</script>

<style scoped>
.container {
	position: relative;
	cursor: pointer;
	user-select: none;

	display: flex;
	flex-direction: row;
}

.media-folder-tree {
	width: 100%;
	display: grid;
	grid-template-columns: 1fr fit-content(100px) fit-content(150px);
	gap: 0 2px;
}
</style>
