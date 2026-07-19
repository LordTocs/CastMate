import { usePluginLogger } from "castmate-core"
import { xorDecrypt, xorEncrypt, xorEncryptWithHeader } from "../crypto/xor-crypto"
import { KasaDeviceConnection } from "../lan-api"
import { BaseKasaTransport } from "./base-transport"
import * as net from "node:net"

const logger = usePluginLogger("tplink-xor")

interface XorKasaTransport extends BaseKasaTransport {
	socket?: net.Socket
}

function xorSocketWrite(socket: net.Socket, message: string | Buffer) {
	return new Promise<void>((resolve, reject) => {
		socket.write(xorEncryptWithHeader(message), (err) => {
			if (err != null) {
				logger.error("XOR WRITE ERROR", err)
				return reject(err)
			}
			resolve()
		})
	})
}

function socketEnd(socket: net.Socket) {
	return new Promise<void>((resolve, reject) => {
		socket.end(() => {
			resolve()
		})
	})
}

function waitData(socket: net.Socket) {
	return new Promise<void>((resolve, reject) => {
		socket.once("readable", () => {
			//logger.log("XOR DATA", data.byteLength)
			resolve()
		})
	})
}

async function waitForData(socket: net.Socket, bytes: number) {
	while (socket.readableLength < bytes) {
		//logger.log("Readable", socket.readableLength, "under", bytes)
		await waitData(socket)
		//logger.log("WAITED!", socket.readableLength)
	}
}

async function xorSocketRead(socket: net.Socket) {
	await waitForData(socket, 4)

	const RESPONSE_BLOCK_SIZE = 4
	const lengthBuffer = socket.read(RESPONSE_BLOCK_SIZE)
	//logger.log("READ", lengthBuffer)
	if (!Buffer.isBuffer(lengthBuffer)) {
		throw new Error("Couldn't get response length")
	}

	const respLength = lengthBuffer.readInt32BE(0)
	if (respLength < 0 || respLength > 100000) {
		throw new Error(`Invalid Response Length ${respLength}`)
	}

	await waitForData(socket, respLength)

	const respBuffer = socket.read(respLength)
	if (!Buffer.isBuffer(respBuffer)) {
		throw new Error("Couldn't Read Response")
	}

	const decrypted = xorDecrypt(respBuffer)
	//logger.log("READ", decrypted)
	return decrypted
}

export function createXORTransport(deviceAddr: KasaDeviceConnection): XorKasaTransport {
	const result: XorKasaTransport = {
		defaultPort: 9999,
		getCredentialsHash() {
			return undefined
		},
		async close() {
			if (this.socket) {
				await socketEnd(this.socket)
			}
			this.socket = undefined
		},
		async reset() {
			await this.close()
		},
		async send(request) {
			let socket: net.Socket
			try {
				socket = await connect()
			} catch (err) {
				throw new Error("Unable to Connect")
			}

			//logger.log("XOR WRITE", request)

			await xorSocketWrite(socket, request)

			const decrypted = await xorSocketRead(socket)

			let jsonData: any
			try {
				jsonData = JSON.parse(decrypted.toString("utf-8"))
			} catch (err) {
				await this.reset()
				throw err
			}

			return jsonData
		},
	}

	const connect = () => {
		return new Promise<net.Socket>((resolve, reject) => {
			if (result.socket != null) return resolve(result.socket)

			const socket = new net.Socket({
				readable: true,
				writable: true,
			})

			socket.once("error", (err) => {
				logger.error("INITAL ERROR", err)
				reject(err)
			})

			socket.on("error", (err) => {
				logger.error("XOR SOCKET ERR", err)
			})

			socket.on("connect", () => {
				//logger.log("XOR CONNECTED")
				socket.setNoDelay()
				resolve(socket)
			})

			socket.on("end", () => {
				logger.log("SOCKET ENDED")
				result.socket = undefined
			})

			socket.connect({
				host: deviceAddr.address,
				port: deviceAddr.port ?? 9999,
			})
		})
	}

	return result
}
