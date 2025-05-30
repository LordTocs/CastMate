import { defineTrigger, onLoad } from "castmate-core"
import { TwitchViewer, TwitchViewerGroup, TwitchViewerUnresolved } from "castmate-plugin-twitch-shared"
import { inTwitchViewerGroup } from "./group"
import { ViewerCache, onViewerSeen } from "./viewer-cache"
import { onChannelAuth } from "./api-harness"

export function setupWalkOns() {
	let walkedOnViewers = new Set<TwitchViewerUnresolved>()

	function resetWalkons() {
		walkedOnViewers = new Set()
	}

	const walkon = defineTrigger({
		id: "walkon",
		name: "Walk on",
		icon: "mdi mdi-walk",
		config: {
			type: Object,
			properties: {
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				viewer: { type: TwitchViewer, required: true, default: "27082158" },
			},
		},
		async handle(config, context, mapping) {
			if (walkedOnViewers.has(context.viewer)) {
				return false
			}

			return await inTwitchViewerGroup(context.viewer, config.group, context)
		},
	})

	onViewerSeen(async (viewer) => {
		const walkedOn = await walkon({
			viewer,
		})

		if (walkedOn) {
			walkedOnViewers.add(viewer)
		}
	})

	onChannelAuth((channel, service) => {
		service.eventsub.onStreamOnline(channel.twitchId, (ev) => {
			resetWalkons()
		})
	})
}
