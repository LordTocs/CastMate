export interface RCONConnectionConfig {
	name: string
	host: string
	port: number
	password: string
}

export interface RCONConnectionState {
	connected: boolean
}
