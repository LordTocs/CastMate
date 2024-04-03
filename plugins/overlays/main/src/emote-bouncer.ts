import { EmoteCache, defineAction } from "castmate-core"
import { OverlayWidget } from "castmate-plugin-overlays-shared"
import { OverlayWebsocketService } from "./websocket-bridge"

export function setupEmoteBouncer() {
	defineAction({
		id: "spawnEmotes",
		name: "Bounce Emotes",
		icon: "mdi mdi-emoticon",
		config: {
			type: Object,
			properties: {
				bouncer: {
					type: OverlayWidget,
					required: true,
					name: "Emote Bouncer",
					widgetType: { plugin: "overlays", widget: "emote-bounce" },
				},
				message: { type: String, required: true, template: true, name: "Emote Message" },
			},
		},
		async invoke(config, contextData, abortSignal) {
			const parsed = EmoteCache.getInstance().parseMessage(config.message)

			OverlayWebsocketService.getInstance().callOverlayRPC(config.bouncer.widgetId, "spawnEmotes", parsed)
		},
	})
}
