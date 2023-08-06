import { AccountConfig } from "castmate-core"
import { Color } from "castmate-schema"

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
