import { createSocket, Socket } from "node:dgram"
import EventEmitter from "node:events"
import { xorDecrypt, xorEncrypt } from "../crypto/xor-crypto"
import { connectKasa, KasaCredentials, KasaDevice } from "../lan-api"
import {
	getAESDiscoveryQuery,
	NEW_DISCOVERY_PORT,
	OTHER_NEW_DISCOVERY_PORT,
	parseAESDiscovery,
	sendAESDiscovery,
} from "./aes-discovery"
import { usePluginLogger } from "castmate-core"
import { parseLegacyDiscovery, sendLegacyDiscovery } from "./legacy-discovery"
import { clearInterval } from "node:timers"

const logger = usePluginLogger("kasa")

function createDiscoverySocket() {
	return new Promise<Socket>((resolve, reject) => {
		const socket = createSocket({ type: "udp4", reuseAddr: true })

		socket.once("error", (err) => {
			reject(err)
		})

		socket.bind(undefined, undefined, () => {
			try {
				socket.setBroadcast(true)
			} catch (err) {
				reject(err)
			}
			resolve(socket)
		})
	})
}

// export interface KasaDiscoverer {
// 	broadcastAddress: string
// 	socket: Socket
// 	startDiscovery(): void
// 	stopDiscovery(): void
// 	close(): void
// }

export interface GoveeDiscoveryEventMap {
	"device-discovered": [info: KasaDevice]
}

export class KasaDiscoverer extends EventEmitter<GoveeDiscoveryEventMap> {
	private interval: NodeJS.Timeout | undefined = undefined

	private discoveredDevices = new Map<string, KasaDevice>()

	constructor(private socket: Socket, private broadcastAddress: string) {
		super()

		socket.on("message", async (msg, rinfo) => {
			//const addr = rinfo.address
			// const kasaDevice: KasaDeviceAddr = {
			// 	address: rinfo.address,
			// 	port: rinfo.port,
			// }
			let device: KasaDevice | undefined = parseLegacyDiscovery(msg, rinfo)
			if (!device) {
				device = parseAESDiscovery(msg, rinfo)
			}

			if (!device) {
				return
			}

			if (!this.discoveredDevices.has(device.id)) {
				try {
					await connectKasa(device)
					this.discoveredDevices.set(device.id, device)
					this.emit("device-discovered", device)
				} catch (err) {}
			}
		})

		socket.on("error", (err) => {
			logger.error("DISCOVERY SOCKET ERROR", err)
		})
	}

	close() {
		this.socket.close()
		this.stopDiscovery()
	}
	stopDiscovery() {
		if (this.interval) {
			clearInterval(this.interval)
			this.interval = undefined
		}
	}

	startDiscovery() {
		logger.log("Starting KASA Discovery")
		this.stopDiscovery()
		this.interval = setInterval(async () => {
			try {
				await this.sendDiscoveryPackets()
			} catch (err) {
				logger.error("Error Sending Kasa Discovery Packets", err)
			}
		}, 60000)
		this.sendDiscoveryPackets().catch((err) => logger.log("Error Sending Kasa Discovery", err))
	}
	sendDiscoveryMessage(message: Buffer | string, port: number) {
		return new Promise<number>((resolve, reject) => {
			this.socket.send(message, port, this.broadcastAddress, (err, bytes) => {
				if (err) {
					return reject(err)
				}
				resolve(bytes)
			})
		})
	}
	async sendDiscoveryPackets() {
		logger.log("SENDING DISCOVERY PACKETS")

		const legacyDiscovery = sendLegacyDiscovery(this)
		//After firmware update, they expect AES encrypted discovery requests.
		const newDiscovery = sendAESDiscovery(this)

		await Promise.allSettled([legacyDiscovery, newDiscovery])
	}
}

export async function createKasaDiscoverer(broadcastAddress: string): Promise<KasaDiscoverer> {
	const socket = await createDiscoverySocket()
	return new KasaDiscoverer(socket, broadcastAddress)
}
