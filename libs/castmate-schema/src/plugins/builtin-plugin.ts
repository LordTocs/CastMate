import { S } from "../schema/schema-base"
import { definePlugin } from "./plugins"

export const CastMateBuiltInPlugin = definePlugin({
	id: "castmate",
	color: "#DE84FF",
	secrets: {},
	settings: {
		port: S.Number({ min: 1, max: 65535, default: 8080 }),
	},
	state: {},
})
