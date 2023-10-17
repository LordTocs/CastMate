import { LightColor } from "./light-color"

export interface LightConfig {
	name: string
	plugin: string
	rgb: {
		available: boolean
	}
	kelvin: {
		available: boolean
		min: number
		max: number
	}
	dimming: {
		available: boolean
	}
	transitions: {
		available: boolean
	}
}

export interface LightState {
	on: boolean
	color: LightColor
}
