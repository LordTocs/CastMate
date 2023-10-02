import { Duration } from "castmate-schema"
import { defineAction, definePlugin, defineSetting } from "castmate-core"
import { abortableSleep } from "castmate-core/src/util/abort-utils"

export default definePlugin(
	{
		id: "castmate",
		name: "CastMate",
		icon: "cmi cmi-castmate",
		color: "#8DC1C0",
		description: "Builtin Actions and Triggers",
	},
	() => {
		const port = defineSetting("port", {
			type: Number,
			required: true,
			default: 8181,
			min: 1,
			max: 65535,
			name: "Internal Webserver Port",
		})
	}
)
