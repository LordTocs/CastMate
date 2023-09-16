import { Color } from "castmate-schema"

export interface ChannelPointRewardConfig {
	twitchId: string | null
	controllable: boolean
	transient: boolean

	name: string
	backgroundColor: Color
	prompt: string
	userInputRequired: boolean
	cost: number
	skipQueue: boolean
	cooldown?: number
	image?: string

	maxRedemptionsPerStream?: number
	maxRedemptionsPerUserPerStream?: number
}

export interface ChannelPointRewardState {
	enabled: boolean
}
