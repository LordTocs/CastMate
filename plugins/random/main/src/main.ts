import { defineAction, defineTrigger, onLoad, onUnload, definePlugin, defineFlowAction } from "castmate-core"

export default definePlugin(
	{
		id: "random",
		name: "Random",
		description: "Randomness",
		icon: "mdi mdi-dice-multiple",
		color: "#EFCC3E",
	},
	() => {
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

				//console.log("Random Weight Total", weightTotal)

				let targetWeight = Math.random() * weightTotal

				//console.log("Random Target Weight", targetWeight)

				for (const [key, flow] of Object.entries(flows)) {
					targetWeight -= flow.weight

					//console.log("   ", targetWeight)

					if (targetWeight <= 0) {
						//console.log("Random", key)
						return key
					}
				}

				return ""
			},
		})
	}
)
