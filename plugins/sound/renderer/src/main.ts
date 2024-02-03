import { WebAudioDeviceInfo } from "castmate-plugin-sound-shared"
import {
	ProjectGroup,
	getResourceAsProjectGroup,
	handleIpcMessage,
	handleIpcRpc,
	useDocumentStore,
	useIpcCaller,
	usePluginStore,
	useProjectStore,
	useResourceStore,
} from "castmate-ui-core"

import SoundActionComponent from "./components/SoundActionComponent.vue"
import { useSoundPlayerStore } from "./player-store"
import { computed, App } from "vue"
import VoiceEditPageVue from "./components/tts/VoiceEditPage.vue"
import _cloneDeep from "lodash/cloneDeep"

export async function getOutputDevices(): Promise<WebAudioDeviceInfo[]> {
	const devices = await navigator.mediaDevices.enumerateDevices()

	const outputDevices = devices.filter((d) => d.kind == "audiooutput")

	return outputDevices.map((d) => ({ groupId: d.groupId, deviceId: d.deviceId, label: d.label, kind: d.kind }))
}

export async function getOutputDeviceWebId(name: string) {
	const allDevices = await navigator.mediaDevices.enumerateDevices()

	const devices = allDevices.filter((d) => d.kind == "audiooutput")

	//For whatever reason chromium appends some junk to the end of some audio devices.
	//Will this cause problems? I don't know!
	const device = devices.find((d) => d.label.startsWith(name))

	return device?.deviceId
}

export async function initPlugin(app: App<Element>) {
	const playerStore = useSoundPlayerStore()
	console.log(await getOutputDevices())

	playerStore.initialize()

	handleIpcRpc("sound", "getOutputWebId", async (name: string) => {
		return await getOutputDeviceWebId(name)
	})

	const pluginStore = usePluginStore()
	pluginStore.setActionComponent("sound", "sound", SoundActionComponent)

	//Setup TTS Resources

	const resourceStore = useResourceStore()
	const documentStore = useDocumentStore()
	documentStore.registerDocumentComponent("ttsvoice", VoiceEditPageVue)

	documentStore.registerSaveFunction("ttsvoice", async (doc) => {
		const docDataCopy = _cloneDeep(doc.data)

		delete docDataCopy.name

		await resourceStore.applyResourceConfig("TTSVoice", doc.id, docDataCopy)
	})

	//Setup Audio Project View

	const projectStore = useProjectStore()

	const voices = getResourceAsProjectGroup(app, {
		resourceType: "TTSVoice",
		resourceName: "TTS Voices",
		groupIcon: "mdi mdi-account-voice",
		documentType: "ttsvoice",
	})

	projectStore.registerProjectGroupItem(
		computed<ProjectGroup>(() => {
			return {
				id: "sound",
				title: "Audio",
				icon: "mdi mdi-volume-high",
				items: [voices.value],
			}
		})
	)
}
