import { defineStore } from "pinia"
import { handleIpcMessage, useInitStore, useIpcCaller, usePluginStore } from "../main"
import { nanoid } from "nanoid/non-secure"
import { computed, markRaw, ref, reactive } from "vue"
import { EventList } from "../main"
import fs from "node:fs"

import _groupBy from "lodash/groupBy"

import { RPCHandler } from "castmate-ws-rpc"

import {
	SatelliteConnectionICECandidate,
	SatelliteConnectionRequest,
	SatelliteConnectionRequestConfig,
	SatelliteConnectionResponse,
	SatelliteConnectionService,
	SatelliteConnectionOption,
	SatelliteConnectionInfo,
} from "castmate-schema"

//Look Here!: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling#signaling_transaction_flow

const googleStunServers = [
	{ urls: "stun:stun.l.google.com:19302" },
	{ urls: "stun:stun.l.google.com:5349" },
	{ urls: "stun:stun1.l.google.com:3478" },
	{ urls: "stun:stun1.l.google.com:5349" },
	{ urls: "stun:stun2.l.google.com:19302" },
	{ urls: "stun:stun2.l.google.com:5349" },
	{ urls: "stun:stun3.l.google.com:3478" },
	{ urls: "stun:stun3.l.google.com:5349" },
	{ urls: "stun:stun4.l.google.com:19302" },
	{ urls: "stun:stun4.l.google.com:5349" },
]

const meteredSTUN = [
	{
		urls: "stun:stun.relay.metered.ca:80",
	},
	{
		urls: "turn:global.relay.metered.ca:80",
		username: "f264fb62658e24373813a648",
		credential: "LQL8adYy2okPQr46",
	},
	{
		urls: "turn:global.relay.metered.ca:80?transport=tcp",
		username: "f264fb62658e24373813a648",
		credential: "LQL8adYy2okPQr46",
	},
	{
		urls: "turn:global.relay.metered.ca:443",
		username: "f264fb62658e24373813a648",
		credential: "LQL8adYy2okPQr46",
	},
	{
		urls: "turns:global.relay.metered.ca:443?transport=tcp",
		username: "f264fb62658e24373813a648",
		credential: "LQL8adYy2okPQr46",
	},
]

const satelliteConnectionRequest = useIpcCaller<(request: SatelliteConnectionRequest) => any>(
	"satellite",
	"satelliteConnectionRequest"
)
const satelliteConnectionResponse = useIpcCaller<(response: SatelliteConnectionResponse) => any>(
	"satellite",
	"satelliteConnectionResponse"
)
const satelliteConnectionIceCandidate = useIpcCaller<(candidate: SatelliteConnectionICECandidate) => any>(
	"satellite",
	"satelliteConnectionIceCandidate"
)

type ConnectionState = "connected" | "connecting" | "disconnected"

const satelliteOnCreated = useIpcCaller<(connectionInfo: SatelliteConnectionInfo) => any>(
	"satellite",
	"onConnectionCreated"
)
const satelliteOnStateChange = useIpcCaller<(id: string, state: ConnectionState) => any>(
	"satellite",
	"onConnectionStateChange"
)
const satelliteOnDeleted = useIpcCaller<(id: string) => any>("satellite", "onConnectionDeleted")
const satelliteOnControlMessage = useIpcCaller<(id: string, data: object) => any>("satellite", "onControlMessage")

const triggerRefreshConnections = useIpcCaller<() => any>("dashboards", "refreshConnections")

interface PendingMediaRequest {
	channel?: RTCDataChannel
	filename: string
	cachename: string
	fileStream: fs.WriteStream
	onDone: (state: "success" | "error") => any
}

class SatelliteConnection {
	connection: RTCPeerConnection
	id: string
	state: ConnectionState = "connecting"
	controlChannel?: RTCDataChannel
	mediaRequests = new Map<string, PendingMediaRequest>()

	constructor(public remoteService: SatelliteConnectionService, public remoteId: string, public dashId: string) {
		this.id = nanoid()
		this.connection = SatelliteConnection.createConnection()
	}

	private static createConnection() {
		const connection = markRaw(
			new RTCPeerConnection({
				iceServers: [...googleStunServers, ...meteredSTUN],
			})
		)

		return connection
	}

	async handleIceCandidate(candidate: SatelliteConnectionICECandidate) {
		const candidateObj = new RTCIceCandidate(candidate.candidate)

		console.log("Receieved Ice Candidate", candidate)
		await this.connection.addIceCandidate(candidateObj)
	}

	async handleResponse(response: SatelliteConnectionResponse) {
		const desc = new RTCSessionDescription(response.sdp)

		console.log("Receieved Connection Response", response)
		await this.connection.setRemoteDescription(desc)
	}
}

export const useSatelliteConnection = defineStore("satellite-connection", () => {
	const connections = ref(new Array<SatelliteConnection>())

	const rtcConnectionOptions = ref(new Array<SatelliteConnectionOption>())

	const onConnection = new EventList<(satelliteId: string) => any>()
	const onDisconnection = new EventList<(satelliteId: string) => any>()
	const onMessage = new EventList<(satelliteId: string, data: object) => any>()

	const rpcs = new RPCHandler()

	const initStore = useInitStore()

	function getConnection(request: SatelliteConnectionRequestConfig) {
		const service = initStore.isCastMate ? request.satelliteService : request.castmateService
		const id = initStore.isCastMate ? request.satelliteId : request.castmateId

		return connections.value.find(
			(c) => c.remoteId == id && c.remoteService == service && request.dashId == c.dashId
		)
	}

	function getConnectionById(connectionId: string) {
		return connections.value.find((c) => c.id == connectionId)
	}

	async function refreshConnections() {
		await triggerRefreshConnections()
	}

	function createConnection(service: SatelliteConnectionService, remoteId: string, dashId: string) {
		const self = reactive(new SatelliteConnection(service, remoteId, dashId))

		const removeSelf = () => {
			const idx = connections.value.findIndex(
				(c) => c.remoteId == remoteId && c.remoteService == service && dashId == c.dashId
			)

			if (idx >= 0) connections.value.splice(idx, 1)

			satelliteOnDeleted(self.id)
			onDisconnection.run(self.id)
		}

		const sendState = () => {
			satelliteOnStateChange(self.id, self.state)
		}

		function checkIfFullyConnected() {
			if (self.controlChannel && self.state != "connected") {
				self.state = "connected"
				onConnection.run(self.id)
				sendState()
			}
		}

		self.connection.ondatachannel = (ev) => {
			if (ev.channel.label == "controlChannel") {
				self.controlChannel = markRaw(ev.channel)
				self.controlChannel.onmessage = (ev) => {
					try {
						const data = JSON.parse(ev.data)
						//console.log("REC RTC", data)
						rpcs.handleMessage(data, (data) => self.controlChannel?.send(JSON.stringify(data)), self.id)
						satelliteOnControlMessage(self.id, data)
						onMessage.run(self.id, data)
					} catch (err) {
						console.error("ERROR", err)
					}
				}

				checkIfFullyConnected()
			} else if (ev.channel.label.startsWith("media:")) {
				//Media requests
				const filename = ev.channel.label.substring(6)

				const request = self.mediaRequests.get(filename)
				if (request) {
					request.channel = ev.channel

					ev.channel.onmessage = (ev) => {
						request.fileStream.write(new Uint8Array(ev.data as ArrayBuffer), (err) => {})
					}

					ev.channel.onerror = (ev) => {
						request.onDone("error")
					}

					ev.channel.onclose = (ev) => {
						request.onDone("success")
					}
				} else {
					ev.channel.close()
				}
			}
		}

		connections.value.push(self)

		satelliteOnCreated({
			id: self.id,
			remoteService: self.remoteService,
			remoteId: self.remoteId,
			type: "dashboard",
			typeId: self.dashId,
		})

		self.connection.onconnectionstatechange = (ev) => {
			switch (self.connection.connectionState) {
				case "new":
				case "connecting":
					console.log("RTC Connection Connecting...")
					break
				case "connected":
					console.log("RTC Connection Connected")
					checkIfFullyConnected()
					break
				case "disconnected":
					console.log("RTC Connection Disconnecting...")
					self.state = "disconnected"
					sendState()
					break
				case "closed":
					console.log("RTC Connection Closed")
					removeSelf()

					break
				case "failed":
					console.log("Error Connection State")

					self.state = "disconnected"
					removeSelf()

					break
				default:
					console.log("Unknown Connection State")
					break
			}
		}

		return self
	}

	//Used by satellite app to request connection to dashboard
	function startDashboardConnection(config: SatelliteConnectionRequestConfig) {
		const self = createConnection(config.castmateService, config.castmateId, config.dashId)

		self.controlChannel = markRaw(self.connection.createDataChannel("controlChannel"))
		self.controlChannel.onmessage = (ev) => {
			try {
				const data = JSON.parse(ev.data)
				console.log("INC MSG", data)
				satelliteOnControlMessage(self.id, data)
				rpcs.handleMessage(data, (data) => self.controlChannel?.send(JSON.stringify(data)), self.id)
				onMessage.run(self.id, data)
			} catch (err) {
				console.error("ERROR", err)
			}
		}

		self.connection.onicecandidate = async (ev) => {
			if (!ev.candidate) return

			const candidateMsg: SatelliteConnectionICECandidate = {
				...config,
				side: "satellite",
				candidate: ev.candidate.toJSON(),
			}

			console.log("Sending Ice Candidate to CastMate")
			await satelliteConnectionIceCandidate(candidateMsg)
		}

		self.connection.onnegotiationneeded = async (ev) => {
			const offer = await self.connection.createOffer()

			await self.connection.setLocalDescription(offer)

			if (!self.connection.localDescription) return

			const connectionObj: SatelliteConnectionRequest = {
				...config,
				sdp: self.connection.localDescription.toJSON(),
			}

			console.log("Sending Connection Request to CastMate", connectionObj)

			//Request Connection from satellite to CastMate
			satelliteConnectionRequest(connectionObj)
		}

		return self
	}

	//Handle incoming satellite connection request (As main CastMate, sent by satellite)
	async function handleClientConnection(desc: SatelliteConnectionRequest) {
		const self = createConnection(desc.satelliteService, desc.satelliteId, desc.dashId)

		const sessionDesc = new RTCSessionDescription(desc.sdp)

		//TODO: Check if permission!

		self.connection.onicecandidate = async (ev) => {
			if (!ev.candidate) return

			const candidateMsg: SatelliteConnectionICECandidate = {
				satelliteService: desc.satelliteService,
				satelliteId: desc.satelliteId,
				castmateService: desc.castmateService,
				castmateId: desc.castmateId,
				dashId: desc.dashId,
				side: "castmate",
				candidate: ev.candidate.toJSON(),
			}

			console.log("Sending Ice Candidate to Satellite")
			await satelliteConnectionIceCandidate(candidateMsg)
		}

		await self.connection.setRemoteDescription(sessionDesc)

		const answer = await self.connection.createAnswer()

		await self.connection.setLocalDescription(answer)

		if (!self.connection.localDescription) return

		const resp: SatelliteConnectionResponse = {
			satelliteService: desc.satelliteService,
			satelliteId: desc.satelliteId,
			castmateService: desc.castmateService,
			castmateId: desc.castmateId,
			dashId: desc.dashId,
			sdp: self.connection.localDescription.toJSON(),
		}

		console.log("Sending Connection Response to Satellite", resp)
		await satelliteConnectionResponse(resp)

		return self
	}

	async function initialize() {
		handleIpcMessage(
			"satellite",
			"satelliteConnectionRequest",
			async (event, request: SatelliteConnectionRequest) => {
				const connection = await handleClientConnection(request)
				if (!connection) return

				connections.value.push(connection)
			}
		)

		handleIpcMessage(
			"satellite",
			"satelliteConnectionResponse",
			async (event, response: SatelliteConnectionResponse) => {
				const connection = getConnection(response)

				if (!connection) return
				connection.handleResponse(response)
			}
		)

		handleIpcMessage(
			"satellite",
			"satelliteConnectionIceCandidate",
			async (event, candidate: SatelliteConnectionICECandidate) => {
				const connection = getConnection(candidate)
				connection?.handleIceCandidate(candidate)
			}
		)

		handleIpcMessage(
			"satellite",
			"setRTCConnectionOptions",
			async (event, options: SatelliteConnectionOption[]) => {
				rtcConnectionOptions.value = options
			}
		)

		handleIpcMessage("satellite", "newRTCConnectionOption", async (event, option: SatelliteConnectionOption) => {
			rtcConnectionOptions.value.push(option)
		})

		handleIpcMessage("satellite", "removeRTCConnectionOption", async (event, optionId: string) => {
			const idx = rtcConnectionOptions.value.findIndex((o) => (o.id = optionId))
			if (idx < 0) return
			rtcConnectionOptions.value.splice(idx, 1)
		})

		///

		handleIpcMessage("satellite", "sendRTCMessage", async (event, id: string, data: string) => {
			const connection = connections.value.find((c) => c.id == id)
			if (!connection?.controlChannel) throw new Error("Tried to Send without Control Channel")
			console.log("SEND RTC", connection?.controlChannel, id, data)
			connection?.controlChannel?.send(data)
		})
	}

	async function connectToCastMate(request: SatelliteConnectionRequestConfig) {
		const connection = startDashboardConnection(request)
	}

	function registerRPCHandler<T extends (connectionId: string, ...args: any[]) => any>(name: string, func: T) {
		//console.log("Registering UI RPC", name)
		rpcs.handle(name, func)
	}

	function unregisterRPCHandler(name: string) {
		rpcs.unhandle(name)
	}

	function callRPC(connectionId: string, name: string, ...args: any[]) {
		return rpcs.call(
			name,
			(data) => getConnectionById(connectionId)?.controlChannel?.send(JSON.stringify(data)),
			...args
		)
	}

	return {
		initialize,
		connectToCastMate,
		connections,
		getConnectionById,
		rtcConnectionOptions,
		refreshConnections,
		onMessage,
		onConnection,
		onDisconnection,
		registerRPCHandler,
		unregisterRPCHandler,
		callRPC,
	}
})

export function useGroupedDashboardRTCConnectionOptions() {
	const satelliteStore = useSatelliteConnection()

	return computed(() => {
		const groups = _groupBy(satelliteStore.rtcConnectionOptions, "remoteUserId")
		return Object.values(groups)
	})
}

export function usePrimarySatelliteConnection() {
	const satelliteStore = useSatelliteConnection()

	return computed(() => {
		if (satelliteStore.connections.length == 0) return undefined
		return satelliteStore.connections[0]
	})
}

export function useOnSatelliteMessage(func: (satelliteId: string, data: object) => any) {
	const satelliteStore = useSatelliteConnection()
	satelliteStore.onMessage.register(func)
}

export function useSatelliteRPC(name: string, func: (satelliteId: string, ...args: any[]) => any) {
	const satelliteStore = useSatelliteConnection()
	satelliteStore.registerRPCHandler(name, func)
}
