import { WebSocket } from "ws"
import { nanoid } from "nanoid/non-secure"
import { usePluginLogger } from "castmate-core"

const logger = usePluginLogger("voicemod")

interface PromiseStorage<T = any> {
	resolve: (result: T) => any
	reject: (reason?: any) => any
}

interface VoiceModVoice {
	id: string
	friendlyName: string
	isEnabled: boolean
	isCustom: boolean
	favorited: boolean
	isNew: boolean
	bitmapChecksum: string
	isPurchased: boolean
	parameters: object
}

export class VoiceModClient {
	private socket: WebSocket | null = null
	private connected: boolean = false
	private handlers: Record<string, (payload: any) => any> = {}
	private rpcCalls: Record<string, PromiseStorage> = {}
	private pinger: NodeJS.Timeout | null = null
	private voicePromise: Promise<any> | null
	private voiceResolver: PromiseStorage | null

	onClose: (() => any) | undefined | null = null
	constructor() {
		this.voicePromise = null

		// this._handle("getVoices", async (payload) => {
		// 	if (this.voicePromise) {
		// 		this.voiceResolver?.resolve(payload)
		// 		this.voiceResolver = null
		// 		this.voicePromise = null
		// 	}
		// })
	}

	private _send(message: object) {
		return new Promise((resolve, reject) => {
			if (!this.socket) return reject()
			//logger.log("VM Send", message)

			this.socket.send(JSON.stringify(message), (err) => {
				if (!err) return resolve(undefined)
				return reject(err)
			})
		})
	}

	private _handle(actionType: string, handler: (payload: any) => any) {
		this.handlers[actionType] = handler
	}

	private _callRPC(action: string, payload = {}) {
		if (!this.socket) return

		const id = nanoid()

		return new Promise<Record<string, any>>((resolve, reject) => {
			this.rpcCalls[id] = {
				resolve: (payload) => {
					resolve(payload)
				},
				reject,
			}

			const message = {
				id,
				action,
				payload,
			}
			this._send(message)
		})
	}

	async getVoices(): Promise<VoiceModVoice[]> {
		const voiceResp = await this._callRPC("getVoices")

		if (!voiceResp) return []

		return voiceResp.voices as VoiceModVoice[]
	}

	selectVoice(id: string) {
		this._send({
			id: nanoid(),
			action: "selectVoice",
			payload: {
				voiceID: id,
			},
		})
	}

	connect(host: string = "127.0.0.1") {
		if (this.connected) return
		return new Promise((resolve, reject) => {
			this.socket = new WebSocket(`ws://${host}:59129/v1/`)

			this.socket.on("close", () => {
				this.connected = false
				//logger.log("Voicemod Connection Closed")

				if (this.pinger) {
					clearInterval(this.pinger)
				}
				this.pinger = null

				this.onClose?.()
			})

			this.socket.on("open", async () => {
				logger.log("Voicemod Connection Opened")

				await this._callRPC("registerClient", { clientKey: "castmate" })
				this.connected = true
				this.pinger = setInterval(() => {
					if (this.socket?.readyState == 1) {
						this.socket.ping()
					}
				}, 30000)
				resolve(undefined)
			})

			this.socket.on("message", async (data, isBinary) => {
				try {
					if (isBinary) return

					const message = JSON.parse(data.toString())

					//console.log("Received: ", message);
					//logger.log("VM Recv", message)

					const id = message.id

					if (id) {
						const rpc = this.rpcCalls[id]
						if (rpc) {
							//logger.log("VM Msg", message.id)
							rpc.resolve(message.payload)
							return
						} else {
							//logger.log("Missing RPC for", message.id)
						}
					}

					if (message.actionType) {
						const handler = this.handlers[message.actionType]
						//logger.log("VM Event: ", message.actionType)
						if (handler) {
							handler(message.actionObject)
						}
					}
				} catch (err) {
					return
				}
			})

			this.socket.on("error", (err) => {
				reject()

				if (this.voicePromise) {
					this.voiceResolver?.reject()
					this.voiceResolver = null
					this.voicePromise = null
				}
			})

			this.socket.on("unexpected-response", (err) => {
				reject()
			})
		})
	}

	disconnect() {
		this.socket?.close()
		this.socket = null

		if (this.voicePromise) {
			this.voiceResolver?.reject()
			this.voiceResolver = null
			this.voicePromise = null
		}
	}
}
