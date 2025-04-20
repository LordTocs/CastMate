import { SoundOutputConfig, WebAudioDeviceInfo } from "castmate-plugin-sound-shared"
import {
	NameDialog,
	NamedData,
	ProjectGroup,
	ProjectItem,
	getResourceAsProjectGroup,
	handleIpcMessage,
	handleIpcRpc,
	useDockingStore,
	useDocumentStore,
	useIpcCaller,
	usePluginStore,
	useProjectStore,
	useResourceData,
	useResourceStore,
} from "castmate-ui-core"

import SoundActionComponent from "./components/SoundActionComponent.vue"
import { useSoundPlayerStore } from "./player-store"
import { computed, App } from "vue"
import VoiceEditPageVue from "./components/tts/VoiceEditPage.vue"
import _cloneDeep from "lodash/cloneDeep"
import { AudioSplitterView } from "./components/splitters/splitter-types"

import { ResourceData } from "castmate-schema"

import { AudioSplitterConfig } from "castmate-plugin-sound-shared"
import _isMatch from "lodash/isMatch"
import AudioSplitterEditPage from "./components/splitters/AudioSplitterEditPage.vue"

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

export async function initSatellitePlugin() {
	const playerStore = useSoundPlayerStore()

	playerStore.initialize()

	handleIpcRpc("sound", "getOutputWebId", async (name: string) => {
		return await getOutputDeviceWebId(name)
	})
}

//TODO: How to handle this better
function createSplitterGroup(app: App<Element>) {
	const resources = useResourceData<ResourceData<AudioSplitterConfig>>("SoundOutput")
	const resourceStore = useResourceStore()
	const dockingStore = useDockingStore()
	const createSplitter = useIpcCaller<(name: string) => any>("sound", "createSplitter")

	const createView = (resource: ResourceData<AudioSplitterConfig>): AudioSplitterView => {
		return {
			scrollX: 0,
			scrollY: 0,
			redirects: resource.config.redirects.map((r) => ({ id: r.id })),
		}
	}

	const group = computed<ProjectGroup>((): ProjectGroup => {
		let items: ProjectItem[] = []
		if (resources.value) {
			let resourceItems = [...resources.value.resources.values()].filter((r) =>
				_isMatch(r.config, { type: "splitter" })
			)

			items = resourceItems.map(
				(r) =>
					({
						id: r.id,
						title: r.config.name ?? r.id,
						open() {
							//TODO how do we get the view data?
							dockingStore.openDocument(
								r.id,
								r.config,
								createView(r) ?? {},
								"audio-splitter",
								"mdi mdi-tune"
							)
						},
						rename(name: string) {
							resourceStore.applyResourceConfig("SoundOutput", r.id, { name })
						},
						delete() {
							resourceStore.deleteResource("SoundOutput", r.id)

							//TODO: dockingStore.closeDocument(r.id)
							//TODO: unsaved data?
						},
					} as ProjectItem)
			)
		}

		const title = "Audio Splitters"

		return {
			id: "audiosplitters",
			title,
			icon: "mdi mdi-tune",
			items,
			create() {
				app.config.globalProperties.$dialog.open(NameDialog, {
					props: {
						header: `Create Audio Splitter`,
						modal: true,
					},
					async onClose(options) {
						if (!options?.data) {
							return
						}

						const name = options.data as string
						if (!name) return

						await createSplitter(name)
					},
				})
			},
		}
	})

	return group
}

export async function initPlugin(app: App<Element>) {
	const playerStore = useSoundPlayerStore()

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

	const redirects = createSplitterGroup(app)

	documentStore.registerDocumentComponent("audio-splitter", AudioSplitterEditPage)

	documentStore.registerSaveFunction("audio-splitter", async (doc) => {
		const docDataCopy = _cloneDeep(doc.data)

		delete docDataCopy.name

		await resourceStore.applyResourceConfig("SoundOutput", doc.id, docDataCopy)
	})

	projectStore.registerProjectGroupItem(
		computed<ProjectGroup>(() => {
			return {
				id: "sound",
				title: "Audio",
				icon: "mdi mdi-volume-high",
				items: [voices.value, redirects.value],
			}
		})
	)
}
