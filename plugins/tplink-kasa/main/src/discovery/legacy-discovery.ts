import { RemoteInfo } from "node:dgram"
import { xorDecrypt, xorEncrypt } from "../crypto/xor-crypto"
import { KasaDiscoverer } from "./base-discovery"
import { usePluginLogger } from "castmate-core"
import { KasaDevice } from "../lan-api"

const logger = usePluginLogger("kasa")

const LEGACY_DISCOVERY_PORT = 9999
const DISCOVERY_QUERY = {
	system: {
		get_sysinfo: {},
	},
}
const DISCOVERY_JSON = JSON.stringify(DISCOVERY_QUERY)

export async function sendLegacyDiscovery(discoverer: KasaDiscoverer) {
	const legacyDiscoveryRequest = xorEncrypt(DISCOVERY_JSON)

	discoverer.sendDiscoveryMessage(legacyDiscoveryRequest, LEGACY_DISCOVERY_PORT)
}

export interface KasaSysInfo {
	sw_ver: string
	hw_ver: string
	model: string
	deviceId: string
	oemId: string
	rssi: number
	latitude_i: number
	logitude_i: number
	alias: string
	status: string
	obd_src: string
	mic_type: string
	feature: string
	mac: string
	updating: number
	led_off: number
	relay_state: number
	on_time: number
	icon_hash: string
	dev_name: string
	active_mode: string
	//next_action: object
	err_code: string
}

interface KasaLegacyDiscovery {
	system: {
		get_sysinfo: KasaSysInfo
	}
}

export function parseLegacyDiscovery(msg: Buffer<ArrayBufferLike>, rinfo: RemoteInfo) {
	if (rinfo.port != LEGACY_DISCOVERY_PORT) return undefined

	try {
		const dataStr = xorDecrypt(Buffer.from(msg.buffer)).toString("utf-8")
		const data = JSON.parse(dataStr) as KasaLegacyDiscovery

		const result: KasaDevice = {
			id: data.system.get_sysinfo.deviceId,
			connection: {
				address: rinfo.address,
				port: rinfo.port,
				encryptionType: "xor",
				protocolType: data.system.get_sysinfo.mic_type.split(".")[0].toLowerCase(),
			},
			deviceType: data.system.get_sysinfo.mic_type,
			discoveryData: data.system.get_sysinfo,
		}
		logger.log("LEGACY DEVICE DISCOVERED", data.system.get_sysinfo.deviceId)
		return result
	} catch (err) {
		logger.error("ERROR PARSING LEGACY DISCOVERY", err)
	}
}
