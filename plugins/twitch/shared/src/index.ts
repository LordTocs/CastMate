import { Color, AccountConfig } from "castmate-schema"

export * from "./group"

export interface TwitchAccountSecrets {
	accessToken: string
}

export interface TwitchAccountConfig extends AccountConfig {
	twitchId: string
}

export interface TwitchUser {
	id: string
	name: string
	color: Color
}

export interface TwitchViewerGroupConfig {
	name: string
	userIds: Set<string>
}
