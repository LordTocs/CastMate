import { defineAction, defineTrigger, onLoad, onUnload, definePlugin } from "castmate-core"

export default definePlugin(
	{
		id: "minecraft",
		name: "Minecraft",
		description: "Communicate with minecraft servers via RCON",
		icon: "mdi mdi-minecraft",
		color: "#66A87B",
	},
	() => {
		defineAction({
			id: "mineCmd",
			name: "Minecraft Command",
			icon: "mdi mdi-minecraft",
			config: {
				type: Object,
				properties: {
					command: { type: String, name: "RCON Command", required: true, default: "", template: true },
				},
			},
			async invoke(config, contextData, abortSignal) {},
		})
	}
)
