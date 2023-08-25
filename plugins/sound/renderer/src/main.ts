import { WebAudioDeviceInfo } from "castmate-plugin-sound-shared"
import { handleIpcMessage, useIpcCaller } from "castmate-ui-core"

export async function getOutputDevices(): Promise<WebAudioDeviceInfo[]> {
	const devices = await navigator.mediaDevices.enumerateDevices()

	const outputDevices = devices.filter((d) => d.kind == "audiooutput")

	return outputDevices.map((d) => ({ groupId: d.groupId, deviceId: d.deviceId, label: d.label, kind: d.kind }))
}

export async function initPlugin() {
	const setAudioOutputDevices = useIpcCaller<(devices: WebAudioDeviceInfo[]) => any>("sound", "setAudioOutputDevices")

	setAudioOutputDevices(await getOutputDevices())
}
