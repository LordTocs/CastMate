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
			<data-input v-if="configSchema" v-model="model.providerConfig" :schema="configSchema" />
		</div>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { TTSVoiceConfig } from "castmate-plugin-sound-shared"
import { ScrollingTabBody, DataInput, ResourceProxyFactory, useIpcCaller, ipcParseSchema } from "castmate-ui-core"
import { TTSVoiceView } from "./tts-types"
import { onBeforeMount, ref, useModel, watch } from "vue"
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import { IPCSchema, Schema } from "castmate-schema"

const model = defineModel<TTSVoiceConfig>({ required: true })

const props = defineProps<{
	view: TTSVoiceView
}>()

const view = useModel(props, "view")

const testMessage = ref("This is a test of text to speech.")

const getVoiceProviderConfigSchema = useIpcCaller<(voiceProviderId: string) => IPCSchema>(
	"sound",
	"getVoiceProviderConfigSchema"
)

const configSchema = ref<Schema>()

onBeforeMount(() => {
	watch(
		() => model.value?.voiceProvider,
		async (newValue, oldValue) => {
			if (newValue) {
				configSchema.value = undefined
				try {
					const ipcSchema = await getVoiceProviderConfigSchema(newValue)
					configSchema.value = ipcParseSchema(ipcSchema)
				} catch (err) {
					console.error("Error Getting VoiceConfigSchema", err)
				}
			} else {
				configSchema.value = undefined
			}
		},
		{ immediate: true }
	)
})
</script>
