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

		defineAction({
			id: "delay",
			name: "Delay",
			icon: "mdi mdi-timer",
			duration: {
				dragType: "length",
				rightSlider: {
					sliderProp: "duration",
				},
			},
			config: {
				type: Object,
				properties: {
					duration: { type: Duration, name: "Duration", template: true, required: true, default: 1.0 },
				},
			},
			async invoke(config, contextData, abortSignal) {
				await abortableSleep(config.duration * 1000, abortSignal)
			},
		})
	}
)
