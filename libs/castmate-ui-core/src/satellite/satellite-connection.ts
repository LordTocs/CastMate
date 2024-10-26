import { defineStore } from "pinia"
import { handleIpcMessage, useIpcCaller, usePluginStore } from "../main"
import { nanoid } from "nanoid/non-secure"
import { computed, markRaw, ref } from "vue"

import _groupBy from "lodash/groupBy"

import { DashboardConnectionOption } from "castmate-plugin-dashboards-shared"

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

interface SatelliteConnectionRequestConfig {
	satelliteService: "twitch"
	satelliteId: string
	castmateService: "twitch"
	castmateId: string
	dashId: string
}

interface SatelliteConnectionRequest extends SatelliteConnectionRequestConfig {
	sdp: RTCSessionDescriptionInit
}

interface SatelliteConnectionResponse {
	satelliteService: "twitch"
	satelliteId: string
	castmateService: "twitch"
	castmateId: string
	dashId: string
	sdp: RTCSessionDescriptionInit
}

interface SatelliteConnectionICECandidate {
	satelliteService: "twitch"
	satelliteId: string
	castmateService: "twitch"
	castmateId: string
	dashId: string
	side: "castmate" | "satellite"
	candidate: RTCIceCandidateInit
}

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
	constructor() {
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
		const self = new SatelliteConnection()

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
		const self = new SatelliteConnection()

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
}

export const useSatelliteConnection = defineStore("satellite-connection", () => {
	const connections = ref(new Map<string, SatelliteConnection>())

	const rtcConnectionOptions = ref(new Array<DashboardConnectionOption>())

	const mode = ref<"satellite" | "castmate">("castmate")

	async function initialize(initMode: "satellite" | "castmate") {
		mode.value = initMode

		handleIpcMessage("satellite", "connectionRequest", async (event, request: SatelliteConnectionRequest) => {
			const connection = await SatelliteConnection.handleClientConnection(request)
			if (!connection) return

			connections.value.set(connection.id, markRaw(connection))
		})

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

		connections.value.set(connection.id, markRaw(connection))
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
