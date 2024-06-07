<template>
	<scrolling-tab-body v-model:scroll-x="view.scrollX" v-model:scroll-y="view.scrollY" inner-class="px-2 py-2">
		<!-- <div class="flex flex-row gap-1 mb-3">
			<p-input-text class="flex-grow-1" v-model="testMessage"></p-input-text>
			<p-button icon="mdi mdi-play" />
		</div> -->
		<div class="pt-3">
			<data-input
				v-model="model.voiceProvider"
				:schema="{
					type: ResourceProxyFactory,
					resourceType: 'TTSVoiceProvider',
					name: 'Provider',
					required: true,
				}"
			/>
		</div>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { TTSVoiceConfig } from "castmate-plugin-sound-shared"
import { ScrollingTabBody, DataInput, ResourceProxyFactory } from "castmate-ui-core"
import { TTSVoiceView } from "./tts-types"
import { ref, useModel } from "vue"
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"

const props = defineProps<{
	modelValue: TTSVoiceConfig
	view: TTSVoiceView
}>()

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const testMessage = ref("This is a test of text to speech.")
</script>
