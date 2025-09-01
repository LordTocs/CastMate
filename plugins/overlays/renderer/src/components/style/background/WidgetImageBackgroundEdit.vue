<template>
	<div class="w-full">
		<filter-input-box
			v-model="undoModel"
			v-model:filter="filterValue"
			@focus="onFocus"
			@blur="onBlur"
			@filter-key-down="onFilterKeyDown"
			:tab-index="-1"
			ref="filterInput"
			class="w-full"
		>
			{{ selectedMedia?.name ?? model }}

			<template #append="{ anchor }">
				<media-drop-down
					:anchor="anchor"
					v-model="dropDown"
					:filter="filterValue"
					@media-clicked="mediaClicked"
					:image="true"
				/>
			</template>
		</filter-input-box>

		<widget-background-settings-edit v-model="model" />
	</div>
</template>

<script setup lang="ts">
import { WidgetBackgroundImage } from "castmate-plugin-overlays-shared"
import WidgetBackgroundSettingsEdit from "./WidgetBackgroundSettingsEdit.vue"

import { MediaFile, SchemaMediaFile, MediaMetadata } from "castmate-schema"
import { FilterInputBox, MediaDropDown, useDefaultableModel, useMediaStore, useUndoCommitter } from "castmate-ui-core"
import { computed, ref } from "vue"

const props = defineProps<{}>()

const model = defineModel<WidgetBackgroundImage>()

const filterInput = ref<InstanceType<typeof FilterInputBox>>()
const filterValue = ref<string>("")
const dropDown = ref(false)

const undoModel = useUndoCommitter(
	useDefaultableModel(model, "image", "", () => ({
		image: "",
	}))
)

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

const mediaStore = useMediaStore()

const selectedMedia = computed({
	get() {
		if (!model.value?.image) return undefined
		return mediaStore.media[model.value.image]
	},
	set(v: MediaMetadata | undefined) {
		undoModel.value = v?.path ?? ""
	},
})
</script>

<style scoped></style>
