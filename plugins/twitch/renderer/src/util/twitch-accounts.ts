import { TwitchAccountConfig } from "castmate-plugin-twitch-shared"
import { ResourceData } from "castmate-schema"
import { useResource } from "castmate-ui-core"

export function useChannelAccountResource() {
	return useResource<ResourceData<TwitchAccountConfig>>("TwitchAccount", "channel")
}
