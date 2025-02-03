<template>
	<data-input-base v-model="model" :schema="schema" :no-float="noFloat" v-slot="inputProps">
		<filter-input-box
			v-bind="inputProps"
			v-model="model"
			v-model:filter="filterValue"
			@focus="onFocus"
			@blur="onBlur"
			@filter-key-down="onFilterKeyDown"
			:tab-index="-1"
			ref="filterInput"
		>
			{{ selectedMedia?.name ?? model }}

			<template #append="{ anchor }">
				<drop-down-panel
					:container="anchor"
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
			</template>
		</filter-input-box>
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"

import { SchemaMediaFile, SchemaBase } from "castmate-schema"
import { computed, nextTick, ref, useModel } from "vue"
import { DropDownPanel, useMediaStore, usePropagationStop } from "../../../main"
import { MediaMetadata } from "castmate-schema"
import { SharedDataInputProps } from "../DataInputTypes"

import FilterInputBox from "../base-components/FilterInputBox.vue"

import MediaTree from "../../media/MediaTree.vue"
import LabelFloater from "../base-components/LabelFloater.vue"
import InputBox from "../base-components/InputBox.vue"
import { useElementSize } from "@vueuse/core"
import { MediaFile } from "castmate-schema"
import PInputText from "primevue/inputtext"
import { useDataBinding, useUndoCommitter } from "../../../util/data-binding"

const props = defineProps<
	{
		schema: SchemaMediaFile & SchemaBase
		modelValue: string | undefined
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

const undoModel = useUndoCommitter(model)

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

const filterInput = ref<InstanceType<typeof FilterInputBox>>()

const filterValue = ref<string>("")
const dropDown = ref(false)

function onFocus(ev: FocusEvent) {
	dropDown.value = true
	filterValue.value = ""
}

function onBlur() {
	dropDown.value = false
}

function onFilterKeyDown(ev: KeyboardEvent) {
	//dropDown.value?.handleKeyEvent(ev)
}

const selectedMedia = computed({
	get() {
		if (!props.modelValue) return undefined
		return mediaStore.media[props.modelValue]
	},
	set(v: MediaMetadata | undefined) {
		undoModel.value = v?.path
	},
})

const stopPropagation = usePropagationStop()

function onDropdownMouseDown(ev: MouseEvent) {
	if (ev.button != 0) return

	stopPropagation(ev)
	ev.preventDefault()
}

function mediaClicked(media: MediaFile) {
	undoModel.value = media
	filterInput.value?.blur()
}
</script>

<style scoped>
.media-folder-tree {
	width: 100%;
	display: grid;
	grid-template-columns: 1fr fit-content(100px) fit-content(150px);
	gap: 0 2px;
}
</style>
