import { Duration } from "castmate-schema"
import { defineAction, definePlugin, defineSetting } from "castmate-core"
import { abortableSleep } from "castmate-core/src/util/abort-utils"
import { defineFlowAction } from "castmate-core/src/queue-system/action"

export default definePlugin(
	{
		id: "castmate",
		name: "CastMate",
		icon: "cmi cmi-castmate",
		color: "#EFCC3E",
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

		defineFlowAction({
			id: "random",
			name: "Random",
			icon: "mdi mdi-dice-multiple",
			config: {
				type: Object,
				properties: {},
			},
			flowConfig: {
				type: Object,
				properties: {
					weight: { type: Number, name: "Weight", required: true, default: 1 },
				},
			},
			async invoke(config, flows, contextData, abortSignal) {
				let weightTotal = 0
				for (const [key, flow] of Object.entries(flows)) {
					weightTotal += flow.weight
				}

				let targetWeight = Math.floor(Math.random() * weightTotal)

				for (const [key, flow] of Object.entries(flows)) {
					targetWeight -= flow.weight

					if (targetWeight <= 0) {
						return key
					}
				}

				return ""
			},
		})
	}
)
