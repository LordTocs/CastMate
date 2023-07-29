import { AccountConfig } from "castmate-core"

export interface TwitchAccountSecrets {
	accessToken: string
}

export interface TwitchAccountConfig extends AccountConfig {
	accountName: string
}
