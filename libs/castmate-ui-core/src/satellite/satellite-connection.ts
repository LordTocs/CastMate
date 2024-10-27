import { defineStore } from "pinia"
import { handleIpcMessage, useIpcCaller, usePluginStore } from "../main"
import { nanoid } from "nanoid/non-secure"
import { computed, markRaw, ref } from "vue"

import _groupBy from "lodash/groupBy"

import { DashboardConnectionOption } from "castmate-plugin-dashboards-shared"
import {
	SatelliteConnectionICECandidate,
	SatelliteConnectionRequest,
	SatelliteConnectionRequestConfig,
	SatelliteConnectionResponse,
	SatelliteConnectionService,
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

class SatelliteConnection {
	connection: RTCPeerConnection
	id: string

	constructor(public remoteService: SatelliteConnectionService, public remoteId: string, public dashId: string) {
		this.id = nanoid()
		this.connection = SatelliteConnection.createConnection()
	}

	private static createConnection() {
		const connection = new RTCPeerConnection({
			iceServers: googleStunServers,
		})

		connection.onconnectionstatechange = (ev) => {
			switch (connection.connectionState) {
				case "new":
				case "connecting":
					console.log("RTC Connection Connecting...")
					break
				case "connected":
					console.log("RTC Connection Connected")
					break
				case "disconnected":
					console.log("RTC Connection Disconnecting...")
					break
				case "closed":
					console.log("RTC Connection Closed")
					break
				case "failed":
					console.log("Error Connection State")
					break
				default:
					console.log("Unknown Connection State")
					break
			}
		}

		return connection
	}

	//Used by satellite app to request connection to dashboard
	static startDashboardConnection(config: SatelliteConnectionRequestConfig) {
		const self = new SatelliteConnection(config.castmateService, config.castmateId, config.dashId)

		self.connection.createDataChannel("controlData")

		self.connection.onicecandidate = async (ev) => {
			if (!ev.candidate) return

			const candidateMsg: SatelliteConnectionICECandidate = {
				...config,
				side: "satellite",
				candidate: ev.candidate,
			}

			await satelliteConnectionIceCandidate(candidateMsg)
		}

		self.connection.onnegotiationneeded = async (ev) => {
			const offer = await self.connection.createOffer()

			await self.connection.setLocalDescription(offer)

			if (!self.connection.localDescription) return

			const connectionObj: SatelliteConnectionRequest = {
				...config,
				sdp: self.connection.localDescription,
			}

			//Request Connection from satellite to CastMate
			satelliteConnectionRequest(connectionObj)
		}

		return self
	}

	//Handle incoming satellite connection request (As main CastMate, sent by satellite)
	static async handleClientConnection(desc: SatelliteConnectionRequest) {
		const self = new SatelliteConnection(desc.satelliteService, desc.satelliteId, desc.dashId)

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
				candidate: ev.candidate,
			}

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
			sdp: self.connection.localDescription,
		}

		await satelliteConnectionResponse(resp)

		return self
	}

	async handleIceCandidate(candidate: SatelliteConnectionICECandidate) {
		const candidateObj = new RTCIceCandidate(candidate.candidate)

		await this.connection.addIceCandidate(candidateObj)
	}

	async handleResponse(response: SatelliteConnectionResponse) {
		const desc = new RTCSessionDescription(response.sdp)

		await this.connection.setRemoteDescription(desc)
	}
}

export const useSatelliteConnection = defineStore("satellite-connection", () => {
	const connections = ref(new Array<SatelliteConnection>())

	const rtcConnectionOptions = ref(new Array<DashboardConnectionOption>())

	const mode = ref<"satellite" | "castmate">("castmate")

	function getConnection(request: SatelliteConnectionRequestConfig) {
		const service = mode.value == "castmate" ? request.satelliteService : request.castmateService
		const id = mode.value == "castmate" ? request.satelliteId : request.castmateId

		return connections.value.find(
			(c) => c.remoteId == id && c.remoteService == service && request.dashId == c.dashId
		)
	}

	async function initialize(initMode: "satellite" | "castmate") {
		mode.value = initMode

		handleIpcMessage(
			"satellite",
			"satelliteConnectionRequest",
			async (event, request: SatelliteConnectionRequest) => {
				const connection = await SatelliteConnection.handleClientConnection(request)
				if (!connection) return

				connections.value.push(markRaw(connection))
			}
		)

		handleIpcMessage(
			"satellite",
			"satelliteConnectionResponse",
			async (event, request: SatelliteConnectionResponse) => {
				const connection = getConnection(request)

				if (!connection) return
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

		handleIpcMessage("satellite", "newRTCConnectionOption", async (event, option: DashboardConnectionOption) => {
			rtcConnectionOptions.value.push(option)
		})

		handleIpcMessage("satellite", "removeRTCConnectionOption", async (event, optionId: string) => {
			const idx = rtcConnectionOptions.value.findIndex((o) => (o.id = optionId))
			if (idx < 0) return
			rtcConnectionOptions.value.splice(idx, 1)
		})
	}

	async function connectToCastMate(request: SatelliteConnectionRequestConfig) {
		const connection = SatelliteConnection.startDashboardConnection(request)

		connections.value.push(connection)
	}

	return { initialize, connectToCastMate, connections, rtcConnectionOptions }
})

export function useGroupedDashboardRTCConnectionOptions() {
	const satelliteStore = useSatelliteConnection()

	return computed(() => {
		const groups = _groupBy(satelliteStore.rtcConnectionOptions, "remoteUserId")

		return Object.values(groups)
	})
}
