import { defineAction, defineTrigger, onLoad, onUnload, definePlugin, StreamPlanManager } from "castmate-core"

export default definePlugin(
	{
		id: "stream-plans",
		name: "Stream Plans",
		description: "Stream Plan",
		icon: "mdi mdi-notebook",
		color: "#67E033",
	},
	() => {
		defineAction({
			id: "nextSegment",
			name: "Next Segment",
			icon: "mdi mdi-skip-next",
			description: "Moves to the next segment in the active stream plan.",
			config: {
				type: Object,
				properties: {},
			},
			async invoke(config, contextData, abortSignal) {
				await StreamPlanManager.getInstance().startNextSegment()
			},
		})

		defineAction({
			id: "prevSegment",
			name: "Previous Segment",
			icon: "mdi mdi-skip-previous",
			description: "Moves to the prev segment in the active stream plan.",
			config: {
				type: Object,
				properties: {},
			},
			async invoke(config, contextData, abortSignal) {
				await StreamPlanManager.getInstance().startPrevSegment()
			},
		})
	}
)
