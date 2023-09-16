import { onChannelAuth } from "./api-harness"
import { TwitchAccount } from "./twitch-auth"
import { ViewerCache } from "./viewer-cache"

export function setupModeration() {
	onChannelAuth((channel, service) => {
		/*service.eventsub.onChannelModeratorAdd(channel.twitchId, (event) => {
			ViewerCache.getInstance().setIsMod(event.userId, false)
		})

		service.eventsub.onChannelModeratorRemove(channel.twitchId, (event) => {
			ViewerCache.getInstance().setIsMod(event.userId, false)
		})*/
	})
}
