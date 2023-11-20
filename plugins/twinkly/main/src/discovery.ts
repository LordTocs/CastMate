import { EventList, getPluginSetting } from "castmate-core"
import dgram from "node:dgram"

export class TwinklyDiscovery {
	socket = dgram.createSocket("udp4")
	interval: NodeJS.Timer | undefined

	onDiscover = new EventList<(ip: string, id: string) => any>()

	constructor() {}

	private bind() {
		return new Promise<void>((resolve, reject) => {
			this.socket.bind(undefined, undefined, () => {
				resolve()
			})
		})
	}

	async initialize() {
		await this.bind()

		this.socket.setBroadcast(true)

		this.socket.on("message", (msg, rinfo) => {
			if (msg.length < 4 + 2 + 2) {
				//4 byte ip, 2 byte OK, 1 byte, 1 null terminator
				console.error("Mystery Twinkly Message")
				return
			}

			const ip = `${msg.readUint8(3)}.${msg.readUint8(2)}.${msg.readUint8(1)}.${msg.readUint8()}`

			const id = msg.subarray(6).toString("ascii")

			this.onDiscover.run(ip, id)
		})

		this.socket.on("error", (err) => {
			console.error("Twinkly Discovery Error!", err)
		})
	}

	startPolling() {
		if (this.interval) {
			clearInterval(this.interval)
		}

		this.interval = setInterval(() => this.poll(), 30 * 1000)
		this.poll()
	}

	poll() {
		const subnetMask = getPluginSetting<string | undefined>("twinkly", "subnetMask")
		if (!subnetMask?.value) return

		this.socket.send(Buffer.from([0x01, 0x64, 0x69, 0x73, 0x63, 0x6f, 0x76, 0x65, 0x72]), 5555, subnetMask.value)
	}
}
