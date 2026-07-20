import * as net from "node:net"
import * as rl from "readline/promises"

export interface WyomingConnection {
	socket: net.Socket
}

export interface WyomingEvent {
	type: string
	data: any
	payload?: Buffer
}

export function connectToWyomingServer(host: string, port: number) {
	const connectPromise = new Promise<net.Socket>((resolve, reject) => {
		const socket = new net.Socket({
			readable: true,
			writable: true,
		})

		socket.once("error", (err) => {
			reject(err)
		})

		socket.on("connect", () => {
			resolve(socket)
		})

		socket.connect({
			host,
			port,
		})
	})

	return connectPromise
}

function socketEnd(socket: net.Socket) {
	return new Promise<void>((resolve, reject) => {
		socket.end(() => {
			resolve()
		})
	})
}

function writeData(socket: net.Socket, data: Buffer) {
	return new Promise<void>((resolve, reject) => {
		socket.write(data, (err) => {
			if (err) {
				reject(err)
			}
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

async function blockingRead(socket: net.Socket, bytes: number): Promise<Buffer> {
	waitForData(socket, bytes)
	return socket.read(bytes)
}

async function readLine(socket: net.Socket) {
	const newLineBuffer = Buffer.from("\n")
	const chars = new Array<Buffer>()
	while (true) {
		let chunk = await blockingRead(socket, 1)
		if (chunk.compare(newLineBuffer) == 0) {
			return Buffer.concat(chars).toString("utf-8")
		}
	}
}

async function sendWyomingEvent(connection: WyomingConnection, event: WyomingEvent) {
	const finalJsonData: Record<string, any> = {
		type: event.type,
		data: event.data,
	}
	if (event.payload) {
		finalJsonData["payload_length"] = event.payload.byteLength
	}

	const jsonStr = JSON.stringify(finalJsonData) + "\n"

	const jsonBuf = Buffer.from(jsonStr)
	await writeData(connection.socket, jsonBuf)
	if (event.payload) {
		await writeData(connection.socket, event.payload)
	}
}

async function readWyomingEvent(connection: WyomingConnection) {
	const jsonLine = await readLine(connection.socket)
	const json = JSON.parse(jsonLine)

	const result: WyomingEvent = {
		type: json["type"],
		data: {},
	}

	if ("data_length" in json) {
		const dataBuffer = await blockingRead(connection.socket, json.data_length)
		const dataStr = dataBuffer.toString("utf-8")
		result.data = JSON.parse(dataStr)
	}

	if ("payload_length" in json) {
		result.payload = await blockingRead(connection.socket, json.payload_length)
	}

	return result
}
