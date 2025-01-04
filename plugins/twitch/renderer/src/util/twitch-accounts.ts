import { TwitchAccountConfig } from "castmate-plugin-twitch-shared"
import { AccountState, ResourceData } from "castmate-schema"
import { useResource } from "castmate-ui-core"

export function useChannelAccountResource() {
	return useResource<ResourceData<TwitchAccountConfig, AccountState>>("TwitchAccount", "channel")
}

export function useBotAccountResource() {
	return useResource<ResourceData<TwitchAccountConfig, AccountState>>("TwitchAccount", "bot")
}
