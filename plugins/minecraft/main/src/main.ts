import { RCONConnectionConfig, RCONConnectionState } from "castmate-plugin-minecraft-shared"
import { defineAction, defineTrigger, onLoad, onUnload, definePlugin, FileResource } from "castmate-core"

export class RCONConnection extends FileResource<RCONConnectionConfig, RCONConnectionState> {}

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
