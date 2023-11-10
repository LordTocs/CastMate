import { Duration, Toggle } from "castmate-schema"
import { ActionQueue, Profile, defineAction, definePlugin, defineSetting } from "castmate-core"
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

		defineAction({
			id: "skip",
			name: "Queue Skip",
			icon: "mdi mdi-skip-next",
			config: {
				type: Object,
				properties: {
					queue: { type: ActionQueue, name: "Queue", required: true },
				},
			},
			async invoke(config, contextData, abortSignal) {
				const runningId = config.queue?.state?.running?.id
				if (runningId) {
					config.queue.skip(runningId)
				}
			},
		})

		defineAction({
			id: "profileActivation",
			name: "Profile Activation",
			icon: "mdi mdi-cogs",
			description: "Sets a profile's activation mode",
			config: {
				type: Object,
				properties: {
					profile: { type: Profile, name: "Profile", required: true },
					activation: {
						type: Toggle,
						name: "Activation Mode",
						required: true,
						default: true,
						toggleIcon: "mdi mdi-cogs",
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				await config.profile?.applyConfig({
					activationMode: config.activation,
				})
			},
		})
	}
)
