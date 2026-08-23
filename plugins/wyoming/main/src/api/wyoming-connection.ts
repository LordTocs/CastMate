import { EventList, RetryTimer, usePluginLogger } from "castmate-core"
import * as net from "node:net"
import { Mutex } from "async-mutex"
import assert from "node:assert"

const logger = usePluginLogger("wyoming")

export interface WyomingConnection {
	socket: net.Socket | undefined
	requestMutex: Mutex
	retry: RetryTimer
	ending: boolean
	onConnected: EventList<(connection: WyomingConnection) => any>
}

export interface WyomingEvent {
	type: string
	data?: any
	payload?: Buffer
}

export async function connectToWyomingServer(
	host: string,
	port: number,
	onConnection: (connection: WyomingConnection) => any
) {
	let connection: WyomingConnection = {
		socket: undefined,
		requestMutex: new Mutex(),
		onConnected: new EventList(),
		ending: false,
		retry: new RetryTimer(async () => {
			logger.log("Trying to connect to Wyoming", host, port, "...")
			const connectPromise = new Promise<void>((resolve, reject) => {
				const socket = new net.Socket({
					readable: true,
					writable: true,
				})

				socket.once("error", (err) => {
					logger.log("WYOMING ERROR!", err)
					reject(err)
				})

				socket.on("connect", async () => {
					logger.log("Wyoming Connected to", host, port)
					socket.setNoDelay()
					connection.socket = socket
					resolve()
				})

				socket.on("close", (hadError) => {
					connection.socket = undefined
					if (connection.ending) {
						logger.log("Wyoming Connection Ended")
					} else {
						logger.error("Wyoming Connection Lost... Retrying")
						connection.retry.tryAgain()
					}
				})

				socket.connect({
					host,
					port,
				})
			})

			await connectPromise
			await connection.onConnected.run(connection)
		}, 60),
	}

	connection.onConnected.register(onConnection)

	await connection.retry.tryNow()

	return connection
}

export async function closeWyomingConnection(connection: WyomingConnection) {
	if (connection.socket) {
		connection.ending = true
		await socketEnd(connection.socket)
	}
}

function socketEnd(socket: net.Socket) {
	return new Promise<void>((resolve, reject) => {
		socket.end(() => {
			resolve()
		})
	})
}

export function writeData(socket: net.Socket, data: Buffer) {
	return new Promise<void>((resolve, reject) => {
		logger.log("Writing Data", JSON.stringify(data.toString()))
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
			//logger.log("Wyoming Data Readable", socket.readableLength)
			resolve()
		})
	})
}

async function blockingRead(socket: net.Socket, bytes: number): Promise<Buffer> {
	const readData = new Array<Buffer>()
	let remaining = bytes
	while (remaining > 0) {
		if (socket.readableLength == 0) {
			await waitData(socket)
		}
		const toRead = Math.min(remaining, socket.readableLength)
		readData.push(socket.read(toRead))
		remaining -= toRead
	}
	return Buffer.concat(readData)
}

const newLineBuffer = Buffer.from("\n")
async function readLine(socket: net.Socket) {
	const chars = new Array<Buffer>()
	while (true) {
		let chunk = await blockingRead(socket, 1)
		chars.push(chunk)
		// logger.log("Read Chunk", chunk, typeof chunk, chunk instanceof Buffer)
		if (chunk.compare(newLineBuffer) == 0) {
			return Buffer.concat(chars).toString("utf-8")
		}
	}
}

export async function sendWyomingEvent(connection: WyomingConnection, event: WyomingEvent) {
	assert(connection.socket)
	logger.log("Sending Wyoming Event", event)
	const finalJsonData: Record<string, any> = {
		type: event.type,
	}
	let dataBuffer: Buffer | undefined = undefined
	if (event.data != null) {
		dataBuffer = Buffer.from(JSON.stringify(event.data))
		finalJsonData["data_length"] = dataBuffer.byteLength
	}

	if (event.payload != null) {
		finalJsonData["payload_length"] = event.payload.byteLength
	}

	const jsonStr = JSON.stringify(finalJsonData)

	logger.log("Writing Event Data", jsonStr)

	const buffers = new Array<Buffer>()
	buffers.push(Buffer.from(jsonStr))
	buffers.push(newLineBuffer)

	if (dataBuffer != null) {
		buffers.push(dataBuffer)
	}
	if (event.payload != null) {
		buffers.push(event.payload)
	}

	await writeData(connection.socket, Buffer.concat(buffers))
}

export async function readWyomingEvent(connection: WyomingConnection) {
	assert(connection.socket)
	const jsonLine = await readLine(connection.socket)
	logger.log("Read JSON line", jsonLine)
	const json = JSON.parse(jsonLine)
	logger.log("Got JSON Event", json)

	const result: WyomingEvent = {
		type: json["type"],
	}

	if ("data_length" in json && json["data_length"] > 0) {
		const dataBuffer = await blockingRead(connection.socket, json.data_length)
		const dataStr = dataBuffer.toString("utf-8")
		//logger.log("Got DataJSON str", dataStr)
		result.data = JSON.parse(dataStr)
		delete json["data_length"]
		delete json["data"]
	}

	if ("payload_length" in json && json["payload_length"] > 0) {
		result.payload = await blockingRead(connection.socket, json.payload_length)
		delete json["payload_length"]
	}

	Object.assign(result, json)

	return result
}

export interface WyomingTTSSpeaker {
	name: string
}

export interface WyomingTTSVoice {
	name: string
	languages: string[]
	speakers?: WyomingTTSSpeaker[]
}

export interface WyomingTTSProgram {
	name: string
	attribution: {
		name: string
		url: string
		installed: boolean
		description: string
		languages: string[]
	}
	voices: WyomingTTSVoice[]
}

export interface WyomingDescription {
	tts: WyomingTTSProgram[]
}

export async function getWyomingDescription(connection: WyomingConnection) {
	return await connection.requestMutex.runExclusive(async () => {
		await sendWyomingEvent(connection, {
			type: "describe",
		})

		const result = await readWyomingEvent(connection)
		return result.data as WyomingDescription
	})
}

export interface WyomingPCMData {
	pcm: Buffer
	rate: number
	width: number
	channels: number
	length: number
}

export async function synthesizeWyomingTTS(
	connection: WyomingConnection,
	voice: {
		name?: string
		language?: string
		speaker?: string
	},
	text: string
) {
	return await connection.requestMutex.runExclusive(async () => {
		await sendWyomingEvent(connection, {
			type: "synthesize",
			data: {
				text,
				voice,
			},
		})

		const audioStart = await readWyomingEvent(connection)
		assert(audioStart.type == "audio-start")

		const PCMChunks = new Array<Buffer>()

		let chunk: WyomingEvent
		do {
			chunk = await readWyomingEvent(connection)
			if (chunk.type == "audio-chunk") {
				assert(chunk.payload)
				PCMChunks.push(chunk.payload)
			}
		} while (chunk.type == "audio-chunk")

		assert(chunk.type == "audio-stop")

		return {
			pcm: Buffer.concat(PCMChunks),
			rate: audioStart.data.rate,
			width: audioStart.data.width,
			channels: audioStart.data.channels,
			length: chunk.data.timestamp / 1000,
		} as WyomingPCMData
	})
}
