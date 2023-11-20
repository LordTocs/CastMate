import { Color, ResolvedSchemaType, Schema, SchemaType, declareSchema } from "castmate-schema"

export const ChannelPointRewardSchema = declareSchema({
	type: Object,
	properties: {
		title: { type: String, name: "Title", required: true, template: true, default: "" },
		prompt: { type: String, name: "Description", template: true },
		backgroundColor: { type: Color, name: "Color", template: true },
		userInputRequired: { type: Boolean, name: "Require User Input" },
		cost: { type: Number, name: "Cost", template: true, min: 1, default: 1, required: true },
		cooldown: { type: Number, name: "Cooldown", template: true },
		maxRedemptionsPerStream: { type: Number, name: "Max Redemptions Per Stream", template: true },
		maxRedemptionsPerUserPerStream: { type: Number, name: "Max Redemptions Per User Per Stream" },
		skipQueue: { type: Boolean, name: "Skip Queue", required: true, default: false },
	},
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
