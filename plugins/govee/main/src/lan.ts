import { sleep, usePluginLogger } from "castmate-core"
import { Color } from "castmate-schema"
import { createSocket, Socket } from "node:dgram"
import * as chromatism from "chromatism2"
import { networkInterfaces } from "node:os"

import EventEmitter from "node:events"
import assert from "node:assert"

//https://community.govee.com/posts/mastering-the-lan-api-series-lan-api-101/136755

const GOVEE_MULTICAST_ADDRESS = "239.255.255.250"
const GOVEE_SEND_PORT = 4001
const GOVEE_LISTEN_PORT = 4002
const GOVEE_COMMAND_PORT = 4003

const logger = usePluginLogger("govee")

export interface GoveeLANScan {
	ip: string
	device: string
	sku: string
	bleVersionHard: string
	bleVersionSoft: string
	wifiVersionHard: string
	wifiVersionSoft: string
}

export interface GoveeLANStatus {
	onOff: 1 | 0
	brightness: number
	color: {
		r: number
		g: number
		b: number
	}
	colorTemInKelvin: number
}

function createMulticastSocket() {
	return new Promise<Socket>((resolve, reject) => {
		const socket = createSocket({
			type: "udp4",
			reuseAddr: true,
		})

		socket.on("listening", () => {
			const addr = socket.address()
			logger.log("Listening!", addr.address, addr.port, addr.family)

			const networks = networkInterfaces()
			for (const netKey of Object.keys(networks)) {
				const network = networks[netKey]
				if (!network) continue

				for (const iface of network) {
					if (iface.family == "IPv4" && !iface.internal) {
						logger.log("   - Adding Multicast Network", netKey, iface.address)
						socket.addMembership(GOVEE_MULTICAST_ADDRESS, iface.address)
					}
				}

				socket.setMulticastLoopback(false)
			}

			resolve(socket)
		})

		socket.once("error", (err) => {
			logger.error("Create Multicast Failed", err)
			reject(err)
		})

		socket.bind(GOVEE_LISTEN_PORT)
	})
}
const SCAN_MESSAGE_DATA = {
	msg: {
		cmd: "scan",
		data: {
			account_topic: "reserve",
		},
	},
}
const SCAN_MESSAGE_REQUEST = JSON.stringify(SCAN_MESSAGE_DATA)
function sendMulticastQuery(socket: Socket) {
	return new Promise<number>((resolve, reject) => {
		socket.send(SCAN_MESSAGE_REQUEST, GOVEE_SEND_PORT, GOVEE_MULTICAST_ADDRESS, (err, bytes) => {
			if (err) {
				logger.error("Error Sending Multicast", err)
				return reject(err)
			}
			// logger.log("Sent Multicast", GOVEE_MULTICAST_ADDRESS, GOVEE_SEND_PORT, bytes)
			resolve(bytes)
		})
	})
}

function sendCommand(socket: Socket, ip: string, data: object) {
	try {
		const dataStr = JSON.stringify(data)
		return new Promise<number>((resolve, reject) => {
			socket.send(dataStr, GOVEE_COMMAND_PORT, ip, (err, bytes) => {
				if (err) {
					logger.log("Error Sending Command", ip, data)
					return reject(err)
				}
				logger.log("Sent Command", ip, data)
				resolve(bytes)
			})
		})
	} catch (err) {}
}

export interface GoveeEventMap {
	"device-status": [ip: string, status: GoveeLANStatus]
	"device-scan": [ip: string, scan: GoveeLANScan]
}

export class GoveeLan extends EventEmitter<GoveeEventMap> {
	private socket: Socket | undefined

	private poller: NodeJS.Timeout | undefined

	async shutdown() {
		if (this.socket) {
			await new Promise<void>((resolve, reject) => {
				if (this.socket) {
					this.socket.close(() => {
						resolve()
					})
				} else {
					resolve()
				}
			})
			this.socket = undefined
		}

		if (this.poller) {
			clearInterval(this.poller)
			this.poller = undefined
		}
	}

	async initialize() {
		await this.shutdown()
		this.socket = await createMulticastSocket()

		this.socket.on("error", async (err) => {
			logger.error("Govee Lan Error", err)
			await this.shutdown()
			await sleep(3000)
			await this.initialize()
		})

		this.socket.on("message", async (msgBuf, rinfo) => {
			try {
				const msgString = msgBuf.toString("utf8")
				const msg = JSON.parse(msgString)
				const cmd = msg.msg?.cmd
				const rawData = msg.msg?.data
				if (!cmd || !rawData) return

				if (cmd == "scan") {
					const data = rawData as GoveeLANScan
					logger.log("Govee Scan", rinfo.address, data)
					this.emit("device-scan", rinfo.address, data)
					if (this.socket) {
						await this.sendStatusQuery(data.ip)
					}
				} else if (cmd == "devStatus") {
					const data = rawData as GoveeLANStatus
					logger.log("Govee Status", rinfo.address, data)
					this.emit("device-status", rinfo.address, data)
				} else {
					logger.log("Unknown GOVEE Lan Message", msg, rinfo.address, rinfo.port, rinfo.size)
				}
			} catch (err) {
				logger.error("GOVEE Lan Error", err)
			}
		})

		this.socket.on("close", () => {
			logger.log("GOVEE Socket Closed")
			this.socket = undefined
		})

		this.socket.on("connect", () => {
			logger.log("GOVEE Socket Connection??") //This shouldn't happen
		})

		this.poller = setInterval(async () => {
			try {
				await this.poll()
			} catch (err) {
				logger.error("Error Polling", err)
			}
		}, 60 * 1000)
	}

	async poll() {
		assert(this.socket)
		try {
			return await sendMulticastQuery(this.socket)
		} catch (err) {}
	}

	async sendOnOff(ip: string, on: boolean) {
		assert(this.socket)
		return await sendCommand(this.socket, ip, {
			msg: {
				cmd: "turn",
				data: {
					value: on ? 1 : 0,
				},
			},
		})
	}

	async sendBrightness(ip: string, brightness: number) {
		assert(this.socket)
		return await sendCommand(this.socket, ip, {
			msg: {
				cmd: "brightness",
				data: {
					value: brightness,
				},
			},
		})
	}

	async sendColorRGB(ip: string, color: { r: number; g: number; b: number }) {
		assert(this.socket)
		return await sendCommand(this.socket, ip, {
			msg: {
				cmd: "colorwc",
				data: {
					color,
					colorTemInKelvin: 0,
				},
			},
		})
	}

	async sendColorTemp(ip: string, kelvin: number) {
		assert(this.socket)
		return await sendCommand(this.socket, ip, {
			msg: {
				cmd: "colorwc",
				data: {
					color: { r: 0, g: 0, b: 0 },
					colorTemInKelvin: kelvin,
				},
			},
		})
	}

	async sendStatusQuery(ip: string) {
		assert(this.socket)
		return await sendCommand(this.socket, ip, {
			msg: {
				cmd: "devStatus",
				data: {},
			},
		})
	}
}
