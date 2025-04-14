<template>
	<scrolling-tab-body inner-class="px-1 py-1">
		<div style="height: 2rem">Audio Redirects allow sounds to be played on multiple outputs.</div>
		<document-data-collection
			v-model="model.redirects"
			v-model:view="view.redirects"
			local-path="redirects"
			:data-component="AudioRedirectEdit"
		>
			<template #header>
				<div class="flex flex-column p-1">
					<div>
						<p-button @click="addNewRedirectStart">Add Audio Output</p-button>
					</div>
				</div>
			</template>

			<template #no-items> </template>
		</document-data-collection>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { AudioRedirectorConfig, AudioRedirect } from "castmate-plugin-sound-shared"
import { ScrollingTabBody, DocumentDataCollection, useCommitUndo } from "castmate-ui-core"
import { AudioRedirectorView, AudioRedirectView } from "./redirect-types"
import AudioRedirectEdit from "./AudioRedirectEdit.vue"
import { nanoid } from "nanoid"
import PButton from "primevue/button"

const model = defineModel<AudioRedirectorConfig>({ required: true })
const view = defineModel<AudioRedirectorView>("view", { required: true })

function createNewRedirect(): [AudioRedirect, AudioRedirectView] {
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

function addNewRedirectEnd() {
	const [redirect, viewdata] = createNewRedirect()
	model.value.redirects.push(redirect)
	view.value.redirects.push(viewdata)
	commitUndo()
}

function addNewRedirectStart() {
	const [redirect, viewdata] = createNewRedirect()
	model.value.redirects.splice(0, 0, redirect)
	view.value.redirects.splice(0, 0, viewdata)
	commitUndo()
}
</script>
