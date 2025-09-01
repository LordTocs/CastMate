<template>
	<data-input-base v-model="model" :schema="schema" :no-float="noFloat" v-slot="inputProps" :local-path="localPath">
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
				<media-drop-down
					:anchor="anchor"
					v-model="dropDown"
					:filter="filterValue"
					@media-clicked="mediaClicked"
					:image="schema.image ?? showAll"
					:sound="schema.sound ?? showAll"
					:video="schema.video ?? showAll"
				/>
			</template>
		</filter-input-box>
	</data-input-base>
</template>

<script setup lang="ts">
import DataInputBase from "../base-components/DataInputBase.vue"

import { SchemaMediaFile, SchemaBase, normalizeMediaPath } from "castmate-schema"
import { computed, nextTick, ref, useModel } from "vue"
import { DropDownPanel, useMediaStore, usePropagationStop } from "../../../main"
import { MediaMetadata } from "castmate-schema"
import { SharedDataInputProps } from "../DataInputTypes"

import FilterInputBox from "../base-components/FilterInputBox.vue"

import MediaDropDown from "../base-components/media/MediaDropDown.vue"
import { MediaFile } from "castmate-schema"
import { useDataBinding, useUndoCommitter } from "../../../util/data-binding"

const props = defineProps<
	{
		schema: SchemaMediaFile & SchemaBase
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const showAll = computed(() => props.schema.image == null && props.schema.video == null && props.schema.sound == null)

const model = defineModel<string>()

const undoModel = useUndoCommitter(model)

const mediaStore = useMediaStore()

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

function mediaClicked(media: MediaFile) {
	undoModel.value = media
	filterInput.value?.blur()
}

const selectedMedia = computed({
	get() {
		return mediaStore.getMedia(model.value)
	},
	set(v: MediaMetadata | undefined) {
		undoModel.value = v?.path
	},
})
</script>
