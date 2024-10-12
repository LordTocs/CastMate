import { defineStore } from "pinia"

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

interface SatelliteConnectionRequest {
	satelliteService: "twitch"
	satelliteId: string
	castmateService: "twitch"
	castmateId: string
	dashId: string
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
	clientId: string
	candidate: RTCIceCandidateInit
}

class SatelliteConnection {
	connection: RTCPeerConnection

	constructor() {
		this.connection = SatelliteConnection.createConnection()
	}

	private static createConnection() {
		const connection = new RTCPeerConnection({
			iceServers: googleStunServers,
		})

		connection.onicecandidate = (ev) => {
			if (!ev.candidate) return

			const candidateMsg: SatelliteConnectionICECandidate = {
				clientId: "todo-id",
				candidate: ev.candidate,
			}

			//SEND(candidateMsg)
		}

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

	static createClient(dashId: string) {
		const self = new SatelliteConnection()

		self.connection.createDataChannel("controlData")

		self.connection.onnegotiationneeded = async (ev) => {
			const offer = await self.connection.createOffer()

			await self.connection.setLocalDescription(offer)

			if (!self.connection.localDescription) return

			const connectionObj: SatelliteConnectionRequest = {
				satelliteService: "twitch",
				satelliteId: "insert-twitchid",
				castmateService: "twitch",
				castmateId: "insert-twitchid",
				dashId,
				sdp: self.connection.localDescription,
			}

			const connectionJSON = JSON.stringify(connectionObj)
			///??? sendToServer(connectionJSON)
		}

		return self
	}

	static async handleClientConnection(desc: SatelliteConnectionRequest) {
		const self = new SatelliteConnection()

		const sessionDesc = new RTCSessionDescription(desc.sdp)

		await self.connection.setRemoteDescription(sessionDesc)

		//Do we need another data channel??

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
	}
}

export const useSatelliteConnection = defineStore("satellite-connection", () => {
	async function initialize() {}

	return { initialize }
})
