import { defineAction, definePlugin } from "castmate-core"
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
		defineAction({
			id: "delay",
			name: "Delay",
			icon: "mdi mdi-timer",
			type: "time",
			config: {
				type: Object,
				properties: {
					duration: { type: Number, name: "Duration", template: true, required: true, default: 1.0 },
				},
			},
			async invoke(config, contextData, abortSignal) {
				await abortableSleep(config.duration * 1000, abortSignal)
			},
		})
	}
)
