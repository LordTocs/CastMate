import { definePlugin } from "castmate-schema"

export * from "./light-color"
export * from "./light"
export * from "./plug"

export function dummy() {}

export const IoTPlugin = definePlugin({
	id: "iot",
	color: "#E2C74D",
	settings: {},
	secrets: {},
	state: {},
})
