import { AccountConfig } from "castmate-schema"

export interface TwitchAccountSecrets {
	accessToken: string
}

export interface TwitchAccountConfig extends AccountConfig {
	twitchId: string
	email?: string
}
