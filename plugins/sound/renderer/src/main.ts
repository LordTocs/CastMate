import { WebAudioDeviceInfo } from "castmate-plugin-sound-shared"
import { handleIpcMessage, useIpcCaller, usePluginStore } from "castmate-ui-core"

import SoundActionComponent from "./components/SoundActionComponent.vue"

export async function getOutputDevices(): Promise<WebAudioDeviceInfo[]> {
	const devices = await navigator.mediaDevices.enumerateDevices()

	const outputDevices = devices.filter((d) => d.kind == "audiooutput")

	return outputDevices.map((d) => ({ groupId: d.groupId, deviceId: d.deviceId, label: d.label, kind: d.kind }))
}

export async function initPlugin() {
	const setAudioOutputDevices = useIpcCaller<(devices: WebAudioDeviceInfo[]) => any>("sound", "setAudioOutputDevices")

	setAudioOutputDevices(await getOutputDevices())

	const pluginStore = usePluginStore()
	pluginStore.setActionComponent("sound", "sound", SoundActionComponent)
}
