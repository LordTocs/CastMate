import { WebAudioDeviceInfo } from "castmate-plugin-sound-shared"
import { handleIpcMessage, handleIpcRpc, useIpcCaller, usePluginStore } from "castmate-ui-core"

import SoundActionComponent from "./components/SoundActionComponent.vue"
import { useSoundPlayerStore } from "./player-store"

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

export async function initPlugin() {
	const playerStore = useSoundPlayerStore()
	console.log(await getOutputDevices())

	playerStore.initialize()

	handleIpcRpc("sound", "getOutputWebId", async (name: string) => {
		return await getOutputDeviceWebId(name)
	})

	const pluginStore = usePluginStore()
	pluginStore.setActionComponent("sound", "sound", SoundActionComponent)
}
