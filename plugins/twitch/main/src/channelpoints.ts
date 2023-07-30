import { RegisterResource, Resource, ResourceStorage, defineTrigger, onLoad } from "castmate-core"

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

@RegisterResource
export class ChannelPointReward extends Resource<ChannelPointRewardConfig> {
	async setConfig(config: Partial<ChannelPointRewardConfig>): Promise<void> {
		await super.setConfig(config)
	}

	static storage: ResourceStorage<ChannelPointReward> = new ResourceStorage<ChannelPointReward>()
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