<template>
	<scrolling-tab-body inner-class="px-1 py-1">
		<div style="height: 2rem">Audio Splitters allow sounds to be played on multiple outputs.</div>
		<document-data-collection
			v-model="model.redirects"
			v-model:view="view.redirects"
			local-path="redirects"
			:data-component="AudioSplitEdit"
		>
			<template #header>
				<div class="flex flex-column p-1">
					<div>
						<p-button @click="addNewSplitStart">Add Audio Output</p-button>
					</div>
				</div>
			</template>

			<template #no-items> </template>
		</document-data-collection>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { AudioSplitterConfig, AudioSplit } from "castmate-plugin-sound-shared"
import { ScrollingTabBody, DocumentDataCollection, useCommitUndo } from "castmate-ui-core"
import { AudioSplitterView, AudioSplitView } from "./splitter-types"
import AudioSplitEdit from "./AudioSplitEdit.vue"
import { nanoid } from "nanoid"
import PButton from "primevue/button"

const model = defineModel<AudioSplitterConfig>({ required: true })
const view = defineModel<AudioSplitterView>("view", { required: true })

function createNewSplit(): [AudioSplit, AudioSplitView] {
	const id = nanoid()
	return [
		{
			id,
			mute: false,
			volume: 100,
			output: undefined,
		},
		{
			id,
		},
	]
}

const commitUndo = useCommitUndo()

function addNewSplitEnd() {
	const [redirect, viewdata] = createNewSplit()
	model.value.redirects.push(redirect)
	view.value.redirects.push(viewdata)
	commitUndo()
}

function addNewSplitStart() {
	const [redirect, viewdata] = createNewSplit()
	model.value.redirects.splice(0, 0, redirect)
	view.value.redirects.splice(0, 0, viewdata)
	commitUndo()
}
</script>
