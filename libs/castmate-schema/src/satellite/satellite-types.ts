export type SatelliteConnectionService = "twitch"

export interface SatelliteConnectionRequestConfig {
	satelliteService: SatelliteConnectionService
	satelliteId: string
	castmateService: SatelliteConnectionService
	castmateId: string
	dashId: string
}

export interface SatelliteConnectionRequest extends SatelliteConnectionRequestConfig {
	sdp: RTCSessionDescriptionInit
}

export interface SatelliteConnectionResponse extends SatelliteConnectionRequestConfig {
	sdp: RTCSessionDescriptionInit
}

export interface SatelliteConnectionICECandidate extends SatelliteConnectionRequestConfig {
	side: "castmate" | "satellite"
	candidate: RTCIceCandidateInit
}
