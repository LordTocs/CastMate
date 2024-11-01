import {
	SatelliteConnectionICECandidate,
	SatelliteConnectionOption,
	SatelliteConnectionRequest,
	SatelliteConnectionResponse,
} from "castmate-schema"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { Service } from "../util/service"
import { PubSubManager } from "../pubsub/pubsub-service"
import { usePluginLogger } from "../logging/logging"

//WebRTC connections are maintained out of the renderer process since no good node-webrtc libs exist

const rendererSatelliteConnectionIceCandidate = defineCallableIPC<(candidate: SatelliteConnectionICECandidate) => any>(
	"satellite",
	"satelliteConnectionIceCandidate"
)
const rendererSatelliteConnectionRequest = defineCallableIPC<(request: SatelliteConnectionRequest) => any>(
	"satellite",
	"satelliteConnectionRequest"
)
const rendererSatelliteConnectionResponse = defineCallableIPC<(response: SatelliteConnectionResponse) => any>(
	"satellite",
	"satelliteConnectionResponse"
)

const rendereSatelliteSetRTCOptions = defineCallableIPC<(response: SatelliteConnectionOption[]) => any>(
	"satellite",
	"setRTCConnectionOptions"
)

const logger = usePluginLogger("satellite")
export const SatelliteService = Service(
	class {
		private pubsubListening = false

		private pubsubMessageHandler: (plugin: string, event: string, data: object) => any

		startListening() {
			if (this.pubsubListening) return
			logger.log("Starting Satellite Listening")
			this.pubsubListening = true

			PubSubManager.getInstance().registerOnMessage(this.pubsubMessageHandler)
		}

		stopListening() {
			if (!this.pubsubListening) return
			this.pubsubListening = false

			PubSubManager.getInstance().unregisterOnMessage(this.pubsubMessageHandler)
		}

		async setRTCConnectionOptions(options: SatelliteConnectionOption[]) {
			rendereSatelliteSetRTCOptions(options)
		}

		constructor(private mode: "satellite" | "castmate") {
			defineIPCFunc("satellite", "satelliteConnectionRequest", async (request: SatelliteConnectionRequest) => {
				await PubSubManager.getInstance().send("satellite", "satelliteConnectionRequest", request)
			})

			defineIPCFunc("satellite", "satelliteConnectionResponse", async (response: SatelliteConnectionResponse) => {
				await PubSubManager.getInstance().send("satellite", "satelliteConnectionResponse", response)
			})

			defineIPCFunc(
				"satellite",
				"satelliteConnectionIceCandidate",
				async (candidate: SatelliteConnectionICECandidate) => {
					await PubSubManager.getInstance().send("satellite", "satelliteConnectionIceCandidate", candidate)
				}
			)

			this.pubsubMessageHandler = async (plugin, event, data) => {
				if (plugin != "satellite") return

				if (event == "satelliteConnectionIceCandidate") {
					rendererSatelliteConnectionIceCandidate(data as SatelliteConnectionICECandidate)
				} else if (event == "satelliteConnectionRequest") {
					if (this.mode == "satellite") return
					rendererSatelliteConnectionRequest(data as SatelliteConnectionRequest)
				} else if (event == "satelliteConnectionResponse") {
					if (this.mode == "castmate") return
					rendererSatelliteConnectionResponse(data as SatelliteConnectionResponse)
				}
			}
		}
	}
)
