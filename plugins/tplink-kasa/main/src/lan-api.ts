import { createSocket, Socket } from "node:dgram"
import { networkInterfaces } from "node:os"
import assert from "node:assert"
import { BaseKasaProtocol } from "./protocols/base-protocol"
import { BaseKasaTransport } from "./transports/base-transport"
import { createXORTransport } from "./transports/xor-transport"
import { createKlapTransport } from "./transports/klap-transport"
import { createIotProtocol, createIotRequest } from "./protocols/iot-protocol"
import { usePluginLogger } from "castmate-core"
import { KasaSysInfo } from "./discovery/legacy-discovery"

export interface KasaCredentials {
	username: string
	password: string
}

export interface KasaDeviceConnection {
	address: string
	port?: number
	protocolType: string
	encryptionType: string
	https?: boolean
	protocol?: BaseKasaProtocol
	transport?: BaseKasaTransport
}

export interface KasaDevice {
	id: string
	connection: KasaDeviceConnection
	deviceType: string
	discoveryData: any
	sysInfo?: KasaSysInfo
}

const logger = usePluginLogger("tplink-kasa")

export async function getKasaSysInfo(device: KasaDevice) {
	assert(device.connection.protocolType == "iot")
	assert(device.connection.protocol)

	const result = (await device.connection.protocol.query(createIotRequest("system", "get_sysinfo"))) as {
		system: {
			get_sysinfo: KasaSysInfo
		}
	}

	return result.system.get_sysinfo
}

export async function setKasaRelayState(device: KasaDevice, relayState: boolean) {
	assert(device.connection.protocolType == "iot")
	assert(device.connection.protocol)

	const result = await device.connection.protocol.query(
		createIotRequest("system", "set_relay_state", {
			state: relayState ? 1 : 0,
		})
	)
}

export function extractKasaRelayState(sysInfo: KasaSysInfo) {
	return sysInfo.relay_state == null || sysInfo.relay_state == 0 ? false : true
}

export async function connectKasa(device: KasaDevice) {
	if (device.connection.encryptionType == "xor") {
		device.connection.transport = createXORTransport(device.connection)
	} else if (device.connection.encryptionType == "klap") {
		device.connection.transport = createKlapTransport(device.connection)
	}

	assert(device.connection.transport, new Error(`Unknown Transport Type ${device.connection.encryptionType}`))

	if (device.connection.protocolType == "iot") {
		device.connection.protocol = createIotProtocol(device.connection.transport)
	}

	assert(device.connection.protocol, new Error(`Unknown Protocol Type ${device.connection.protocolType}`))

	try {
		const result = await getKasaSysInfo(device)
		device.sysInfo = result
		logger.log("sysinfo", result.alias, result.deviceId)
		device.id = result.deviceId
	} catch (err) {
		logger.error("Error getting sysinfo", err)
		throw err
	}
}
