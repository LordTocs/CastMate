import { Color, S, Schema, SchemaType } from "castmate-schema"

export const ChannelPointRewardSchema = S.Object({
	title: S.String({ maxLength: 45 }),
	prompt: S.Optional(S.String({ maxLength: 200 })),
	backgroundColor: S.Optional(S.Color()),
	userInputRequired: S.Boolean({ default: false }),
	cost: S.Number({ min: 1 }),
	cooldown: S.Optional(S.Duration()),
	maxRedeptionsPerStream: S.Optional(S.Number()),
	maxRedemptionsPerUserPerStream: S.Optional(S.Number()),
	skipQueue: S.Boolean({ default: false }),
})

export type ChannelPointRewardTemplate = SchemaType<typeof ChannelPointRewardSchema>
export type ChannelPointRewardData = ResolvedSchemaType<typeof ChannelPointRewardSchema>

export interface ChannelPointRewardConfig {
	twitchId: string | null
	controllable: boolean
	transient: boolean
	allowEnable: boolean

	name: string

	rewardData: Omit<ChannelPointRewardTemplate, "title">
}

export interface ChannelPointRewardState {
	enabled: boolean
	//Indicates if CastMate wants the channel point reward active
	shouldEnable: boolean

	image?: string
	rewardData?: ChannelPointRewardData
	//cooldownExpiry: Date | null
	inStock: boolean
}
