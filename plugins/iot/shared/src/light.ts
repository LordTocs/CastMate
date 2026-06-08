import { defineResource, Resource, S } from "castmate-schema"
import { LightColor } from "./light-color"
import { IoTPlugin } from "./main"

export const LightResourceSpec = defineResource(IoTPlugin, {
	id: "light",
	config: {
		provider: S.String(),
		providerId: S.String(),
		rgb: S.Object({
			available: S.Boolean(),
		}),
		kelvin: S.Object({
			available: S.Boolean(),
			range: S.Range(S.Number()),
		}),
		dimming: S.Object({
			available: S.Boolean(),
		}),
		transitions: S.Object({
			available: S.Boolean(),
		}),
		topology: S.LightTopology(),
	},
	state: {
		on: S.Boolean(),
		color: S.LightColor(),
	},
	functions: {
		setLightState: S.Function(S.Boolean(), [S.LightColor(), S.Toggle(), S.Duration()]),
	},
})

export type LightResource = Resource<typeof LightResourceSpec>
export type LightConfig = LightResource["config"]
export type LightState = LightResource["state"]
