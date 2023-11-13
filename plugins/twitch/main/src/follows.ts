import { defineState, defineTrigger } from "castmate-core"
import { onChannelAuth } from "./api-harness"
import { ViewerCache } from "./viewer-cache"
import { TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import { inTwitchViewerGroup } from "./group"
import { TwitchAccount } from "./twitch-auth"

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
				user: { type: String, required: true, default: "LordTocs" },
				userId: { type: String, required: true, default: "27082158" },
				userColor: { type: String, required: true, default: "#4411FF" },
			},
		},
		async handle(config, context) {
			if (!(await inTwitchViewerGroup(context.userId, config.group))) {
				return false
			}
			return true
		},
	})

	const followers = defineState("followers", {
		type: Number,
		required: true,
		default: 0,
		name: "Followers",
	})

	async function updateFollowCount() {
		followers.value = await TwitchAccount.channel.apiClient.channels.getChannelFollowerCount(
			TwitchAccount.channel.twitchId
		)
	}

	onChannelAuth(async (account, service) => {
		service.eventsub.onChannelFollow(account.twitchId, account.twitchId, async (event) => {
			follow({
				user: event.userDisplayName,
				userId: event.userId,
				userColor: await ViewerCache.getInstance().getChatColor(event.userId),
			})
		})

		await updateFollowCount()
	})
}
