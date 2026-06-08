import { definePlugin, S } from "castmate-schema"

export const LIFXPlugin = definePlugin({
	id: "lifx",
	color: "#000000",
	secrets: {},
	settings: {
		broadcastAddress: S.String(),
	},
	state: {},
})
