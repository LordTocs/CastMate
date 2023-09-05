import { Resource, ResourceStorage, defineTrigger, onLoad } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { Color } from "castmate-schema"

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
	backgroundColor: Color
	prompt: string
	cost: number
	skipQueue: boolean
	cooldown?: number

	maxRedemptionsPerStream?: number
	maxRedemptionsPerUserPerStream?: number
}

interface ChannelPointRewardState {
	enabled: boolean
}

export class ChannelPointReward extends Resource<ChannelPointRewardConfig> {
	static storage = new ResourceStorage<ChannelPointReward>("ChannelPointReward")

	static findByTwitchId(twitchId: string) {
		for (let r of this.storage) {
			if (r.config.twitchId == twitchId) return r
		}

		return undefined
	}
}

export function setupChannelPointRewards() {
	onLoad(() => {
		ChannelPointReward.initialize()
	})

	async function loadRewards() {
		const channelAccount = TwitchAccount.storage.getById("channel")

		if (!channelAccount) {
			return
		}

		const channelId = channelAccount.config.twitchId

		const rewards = await channelAccount.apiClient.channelPoints.getCustomRewards(channelId)
		const castMateRewards = await channelAccount.apiClient.channelPoints.getCustomRewards(channelId, true)

		const nonCastMateRewards = rewards.filter((r) => castMateRewards.find((o) => o.id == r.id) == null)

		for (let r of nonCastMateRewards) {
			const config: ChannelPointRewardConfig = {
				twitchId: r.id,
				controllable: false,
				transient: false,

				title: r.prompt,
				backgroundColor: r.backgroundColor as Color,
				prompt: r.prompt,
				cost: r.cost,
				skipQueue: r.autoFulfill,
				cooldown: r.globalCooldown ?? undefined,

				maxRedemptionsPerStream: r.maxRedemptionsPerStream ?? undefined,
				maxRedemptionsPerUserPerStream: r.maxRedemptionsPerUserPerStream ?? undefined,
			}

			const newReward = new ChannelPointReward()
		}

		for (let r of castMateRewards) {
			//Validate rewards
			const cpr = ChannelPointReward.findByTwitchId(r.id)

			if (!cpr) {
				//We must have wiped our user directory, the file companion to this channel point is missing
				const reward = new ChannelPointReward()
				const config: ChannelPointRewardConfig = {
					twitchId: r.id,
					controllable: true,
					transient: false,

					title: r.prompt,
					backgroundColor: r.backgroundColor as Color,
					prompt: r.prompt,
					cost: r.cost,
					skipQueue: r.autoFulfill,
					cooldown: r.globalCooldown ?? undefined,

					maxRedemptionsPerStream: r.maxRedemptionsPerStream ?? undefined,
					maxRedemptionsPerUserPerStream: r.maxRedemptionsPerUserPerStream ?? undefined,
				}
			}
		}

		for (let reward of ChannelPointReward.storage) {
			if (!reward.config.controllable) continue
			if (reward.config.transient) continue

			const twitchReward = castMateRewards.find((r) => r.id == reward.config.twitchId)

			if (!twitchReward) {
				//Reward is missing... Recreate
			}
		}
	}

	const redemption = defineTrigger({
		id: "redemption",
		name: "Channel Point Reward",
		version: "0.0.1",
		icon: "mdi mdi-pencil",
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
