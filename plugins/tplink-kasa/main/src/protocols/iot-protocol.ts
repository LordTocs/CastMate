import { BaseKasaTransport } from "../transports/base-transport"
import { BaseKasaProtocol } from "./base-protocol"
import { Mutex } from "async-mutex"

export function createIotRequest(target: string, command: string, arg: any = {}) {
	return {
		[target]: {
			[command]: arg,
		},
	}
}

export function createIotProtocol(transport: BaseKasaTransport): BaseKasaProtocol {
	const lock = new Mutex()

	return {
		async query(request) {
			return await lock.runExclusive(async () => {
				const encodedRequest = typeof request == "string" ? request : JSON.stringify(request)
				return await transport.send(encodedRequest)
			})
		},
	}
}
