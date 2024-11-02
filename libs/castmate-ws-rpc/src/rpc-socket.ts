import { WebSocket } from "ws"
import { customAlphabet } from "nanoid/non-secure"
import { DelayedResolver, createDelayedResolver } from "castmate-schema"

const idGen = customAlphabet("abcdefghijklmnop0123456789", 10)

interface ResponseMessageFailure {
	responseId: string
	failed: any
}

interface ResponseMessageSuccess {
	responseId: string
	result: any
}

type ResponseMessage = ResponseMessageSuccess | ResponseMessageFailure

interface RequestMessage {
	requestId: string
	name: string
	args: any[]
}

export type RPCMessage = ResponseMessage | RequestMessage
type Sender = (data: RPCMessage) => any

export class RPCHandler {
	private outstandingCalls: Record<string, DelayedResolver<any>> = {}
	private handlers: Record<string, (id: string, sender: Sender, ...args: any[]) => any> = {}

	constructor() {}

	async handleMessage(data: RPCMessage, sender: (data: RPCMessage) => any, ...preArgs: any[]) {
		if ("responseId" in data) {
			const outstandingCall = this.outstandingCalls[data.responseId]
			if (!outstandingCall) {
				return
			}
			try {
				if ("failed" in data) {
					outstandingCall.reject(data.failed)
				} else {
					outstandingCall.resolve(data.result)
				}
			} catch {
				outstandingCall.reject()
			} finally {
				delete this.outstandingCalls[data.responseId]
			}
		} else if ("requestId" in data) {
			const requestName = data.name
			const requestId = data.requestId
			if (!requestName) {
				return
			}
			const args = data.args || []

			const handler = this.handlers[requestName]

			if (handler) {
				handler(requestId, sender, ...preArgs, ...args)
			} else {
				console.log("MISSING HANDLER", requestName)
			}
		}
	}

	handle(name: string, func: (...args: any[]) => any) {
		if (name in this.handlers) throw new Error(`RPC ${name} already set`)
		this.handlers[name] = async (requestId, sender, ...args) => {
			let result
			try {
				result = await func(...args)
			} catch (err) {
				await sender({
					responseId: requestId,
					failed: true,
				})
				return
			}
			await sender({
				responseId: requestId,
				result,
			})
		}
	}

	unhandle(name: string) {
		delete this.handlers[name]
	}

	call(name: string, sender: (message: RPCMessage) => any, ...args: any[]) {
		const resolver = createDelayedResolver<unknown>()

		const data = {
			name,
			requestId: idGen(),
			args: [...args],
		}

		this.outstandingCalls[data.requestId] = resolver

		sender(data)

		return resolver.promise
	}
}

export class RPCWebSocket {
	private handler = new RPCHandler()
	private sender = (message: RPCMessage) => this.socket.send(JSON.stringify(message))

	constructor(private socket: WebSocket) {
		this.socket.onmessage = async (event) => {
			let data = undefined
			if (typeof event.data != "string") return

			try {
				data = JSON.parse(event.data)
			} catch {
				return
			}

			this.handler.handleMessage(data, this.sender)
		}
	}

	handle(name: string, func: (...args: any[]) => any) {
		this.handler.handle(name, func)
	}

	async call<T extends (...args: any[]) => any>(name: string, ...args: Parameters<T>): Promise<ReturnType<T>> {
		return (await this.handler.call(name, this.sender, ...args)) as ReturnType<T>
	}
}
