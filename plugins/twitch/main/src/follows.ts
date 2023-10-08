import { defineTrigger } from "castmate-core"
import { onChannelAuth } from "./api-harness"
import { ViewerCache } from "./viewer-cache"
import { TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import { inTwitchViewerGroup } from "./group"

export function setupFollows() {
	const follow = defineTrigger({
		id: "follow",
		name: "Followed",
		icon: "mdi mdi-heart",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true },
				userId: { type: String, required: true },
				userColor: { type: String, required: true },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.userId, config.group))) {
				return false
			}
			return true
		},
	})

	onChannelAuth((account, service) => {
		service.eventsub.onChannelFollow(account.twitchId, account.twitchId, async (event) => {
			follow({
				user: event.userDisplayName,
				userId: event.userId,
				userColor: await ViewerCache.getInstance().getChatColor(event.userId),
			})
		})
	})
}
