import { Resource, ResourceStorage, defineTrigger, onLoad } from "castmate-core"

interface TwitchChannelPointRewardInfo {
	title: string
	description: string
	color: string //TODO: Color
}

interface ChannelPointRewardConfig {
	twitchId: string
	controllable: boolean
	transient: boolean
	title: string
	points: string
}

interface ChannelPointRewardState {}

export class ChannelPointReward extends Resource<ChannelPointRewardConfig> {
	static storage = new ResourceStorage<ChannelPointReward>("ChannelPointReward")
}

export function setupChannelPointRewards() {
	onLoad(() => {
		ChannelPointReward.initialize()
	})

	defineTrigger({
		id: "redemption",
		name: "Channel Point Reward",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {
				reward: { type: ChannelPointReward, name: "Reward", required: true },
			},
		},
		context: {
			type: Object,
			properties: {
				reward: { type: ChannelPointReward, required: true },
			},
		},
		async handle(config, context) {
			if (config.reward.id == context.reward.id) {
				return true
			}

			return false
		},
	})
}
