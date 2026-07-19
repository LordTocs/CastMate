import * as crypto from "node:crypto"
import { crc32 } from "crc"
import { KasaDiscoverer } from "./base-discovery"
import { RemoteInfo } from "node:dgram"
import { usePluginLogger } from "castmate-core"
import { KasaDevice } from "../lan-api"
export const NEW_DISCOVERY_PORT = 20002
export const OTHER_NEW_DISCOVERY_PORT = 20003

const logger = usePluginLogger("kasa")

export interface AESKeyPair {
	publicKey: crypto.KeyObject
	privateKey: crypto.KeyObject
}

let keyPair: AESKeyPair | undefined = undefined
function createAESDiscoveryKey(keySize: number = 1024) {
	return new Promise<AESKeyPair>((resolve, reject) => {
		crypto.generateKeyPair(
			"rsa",
			{
				modulusLength: keySize,
				publicExponent: 65537,
			},
			(err, publicKey, privateKey) => {
				if (err) {
					return reject(err)
				}
				resolve({
					publicKey,
					privateKey,
				})
			}
		)
	})
}

export async function getAESDiscoveryQuery(): Promise<Buffer> {
	if (!keyPair) {
		keyPair = await createAESDiscoveryKey()
	}
	const secret = crypto.randomBytes(4)

	const keyPayload = {
		params: { rsa_key: keyPair.publicKey.export({ format: "pem", type: "spki" }).toString("utf-8") },
	}

	const keyPayloadBytes = Buffer.from(JSON.stringify(keyPayload))

	//Based off python-kasa
	const version = 2 // Version of tdp
	const msgType = 0
	const opCode = 1 // probe
	const msgSize = keyPayloadBytes.byteLength
	const flags = 17
	//const paddingByte = 0 // blank byte
	//const deviceSerial = keyPayloadBytes.readInt32BE(0)
	const initialCrc = 0x5a6b7c8d //Magic number?

	const result = Buffer.alloc(16 + keyPayloadBytes.byteLength, 0)

	result.writeUInt8(version, 0)
	result.writeUInt8(msgType, 1)
	result.writeUInt16BE(opCode, 2)
	result.writeUInt16BE(msgSize, 4)
	result.writeUInt8(flags, 6)
	//result.writeInt8(padding, 7)
	secret.copy(result, 8)
	result.writeUInt32BE(initialCrc, 12)
	keyPayloadBytes.copy(result, 16)

	const finalCrc = crc32(result)
	result.writeUInt32BE(finalCrc, 12)

	return result
}

export async function sendAESDiscovery(discoverer: KasaDiscoverer) {
	const aesDiscoveryRequest = await getAESDiscoveryQuery()
	return await Promise.allSettled([
		discoverer.sendDiscoveryMessage(aesDiscoveryRequest, NEW_DISCOVERY_PORT),
		discoverer.sendDiscoveryMessage(aesDiscoveryRequest, OTHER_NEW_DISCOVERY_PORT),
	])
}

export interface AESDiscoveryData {
	result: {
		device_id: string
		owner: string
		device_type: string
		device_model: string
		hw_ver: string
		ip: string
		mac: string
		obd_src: string
		protocol_version: number
		factory_default: boolean
		mgt_encrypt_schm: {
			is_support_https: boolean
			encrypt_type: string
			new_klap: number
			ANS: boolean
			http_port: number
			lv: number
		}
	}
}

export function parseAESDiscovery(msg: Buffer<ArrayBufferLike>, rinfo: RemoteInfo) {
	if (!(rinfo.port == NEW_DISCOVERY_PORT || rinfo.port == OTHER_NEW_DISCOVERY_PORT)) {
		return undefined
	}
	try {
		const dataStr = Buffer.from(msg.buffer.slice(16)).toString("utf-8")
		const data = JSON.parse(dataStr) as AESDiscoveryData
		logger.log("AES DEVICE DISCOVERED", data.result.device_id)

		return {
			id: data.result.device_id,
			name: "honk",
			deviceType: data.result.device_type,
			discoveryData: data,
			connection: {
				address: data.result.ip,
				encryptionType: data.result.mgt_encrypt_schm.encrypt_type.toLocaleLowerCase(),
				https: data.result.mgt_encrypt_schm.is_support_https,
				protocolType: data.result.device_type.split(".")[0].toLowerCase(),
			},
		} as KasaDevice
	} catch (err) {
		logger.error("ERROR PARSING NEW DISCOVERY", err)
	}
}
