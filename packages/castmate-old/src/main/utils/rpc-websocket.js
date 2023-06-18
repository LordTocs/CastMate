import { customAlphabet } from "nanoid/non-secure"

export class RPCWebSocket {
	constructor(socket) {
		this.socket = socket

		this.outstandingCalls = {}
		this.handlers = {}
		this.idGen = customAlphabet("abcdefghijklmnop0123456789", 10)

		this.socket.on("message", async (textData) => {
			let data = null
			try {
				data = JSON.parse(textData)
			} catch {
				return
			}

			if ("responseId" in data) {
				const outstandingCall = this.outstandingCalls[data.responseId]
				if (!outstandingCall) {
					//error!
					return
				}
				try {
					if (data.failed) {
						outstandingCall.reject()
					} else {
						outstandingCall.resolve(data.result)
					}
				} catch {
					outstandingCall.reject()
				} finally {
					delete outstandingCall[data.responseId]
				}
			} else if ("requestId" in data) {
				const requestName = data.name
				const requestId = data.requestId
				if (!requestName) {
					return
				}
				const args = data.args || []

				if (!(requestName in this.handlers))
				{
					console.error("Missing RPCSocket Handler", requestName)
					this.socket.send(
						JSON.stringify({
							responseId: requestId,
							failed: true,
						})
					)
				}
				else
				{
					this.handlers[requestName](requestId, ...args)
				}
			}
		})
	}

	handle(name, func) {
		this.handlers[name] = async (requestId, ...args) => {
			let result
			try {
				result = await func(...args)
			} catch (err) {
				await this.socket.send(
					JSON.stringify({
						responseId: requestId,
						failed: true,
					})
				)
				return
			}
			await this.socket.send(
				JSON.stringify({
					responseId: requestId,
					result,
				})
			)
		}
	}

	call(name, ...args) {
		const promise = new Promise(async (resolve, reject) => {
			const data = {
				name,
				requestId: this.idGen(),
				args: [...args],
			}

			this.outstandingCalls[data.requestId] = { resolve, reject }

			await this.socket.send(JSON.stringify(data))
		})
		return promise
	}
}
