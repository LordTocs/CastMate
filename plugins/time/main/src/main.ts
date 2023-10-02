import { Duration } from "castmate-schema"
import { defineAction, defineTrigger, onLoad, onUnload, definePlugin, abortableSleep } from "castmate-core"

export default definePlugin(
	{
		id: "time",
		name: "Time",
		description: "Time Utilities",
		icon: "mdi mdi-clock-outline",
	},
	() => {
		//Plugin Intiialization

		defineAction({
			id: "delay",
			name: "Delay",
			icon: "mdi mdi-timer-sand",
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
