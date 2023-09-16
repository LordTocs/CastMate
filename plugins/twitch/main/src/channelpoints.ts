import { Resource, ResourceStorage, defineTrigger, onLoad } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { Color } from "castmate-schema"
import { ChannelPointRewardConfig, ChannelPointRewardState, TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import { HelixCreateCustomRewardData, HelixCustomReward } from "@twurple/api"
import { nanoid } from "nanoid/non-secure"
import { onChannelAuth } from "./api-harness"
import { ViewerCache } from "./viewer-cache"
import { inTwitchViewerGroup } from "./group"
import { getRawData } from "@twurple/common"

function needsUpdate(reward: HelixCustomReward | undefined, data: HelixCreateCustomRewardData) {
	if (!reward) return true

	// console.log("Needs Update")
	// console.log(getRawData(reward))
	// console.log("---")
	// console.log(data)

	if (reward.title != data.title) return true
	if (reward.cost != data.cost) return true
	if (reward.prompt != data.prompt) return true
	if (reward.backgroundColor != data.backgroundColor) return true
	if (reward.userInputRequired != data.userInputRequired) return true
	if (reward.maxRedemptionsPerStream != data.maxRedemptionsPerStream) return true
	if (reward.maxRedemptionsPerUserPerStream != data.maxRedemptionsPerUserPerStream) return true
	return false
}

export class ChannelPointReward extends Resource<ChannelPointRewardConfig, ChannelPointRewardState> {
	static storage = new ResourceStorage<ChannelPointReward>("ChannelPointReward")
	static resourceDirectory = "./twitch/channelpoints"

	static getByTwitchId(twitchId: string) {
		for (let r of this.storage) {
			if (r.config.twitchId == twitchId) return r
		}

		return undefined
	}

	constructor(config?: ChannelPointRewardConfig) {
		super()

		if (config) {
			this._id = nanoid()
			this._config = {
				...config,
			}
		}

		this.state = {
			enabled: false,
		}
	}

	static async initialize() {
		await super.initialize()
	}

	//Called when we discover a CastMate controlled reward that doesn't have a resource
	static async recoverLocalReward(reward: HelixCustomReward) {
		const config: ChannelPointRewardConfig = {
			twitchId: reward.id,
			controllable: true,
			transient: false,

			name: reward.title,
			backgroundColor: reward.backgroundColor as Color,
			prompt: reward.prompt,
			userInputRequired: reward.userInputRequired,
			cost: reward.cost,
			skipQueue: reward.autoFulfill,
			cooldown: reward.globalCooldown ?? undefined,
			image: reward.getImageUrl(4),

			maxRedemptionsPerStream: reward.maxRedemptionsPerStream ?? undefined,
			maxRedemptionsPerUserPerStream: reward.maxRedemptionsPerUserPerStream ?? undefined,
		}

		console.log("Recovering", config)

		const result = new ChannelPointReward(config)

		await this.storage.inject(result)

		return result
	}

	static async createNonCastmateReward(reward: HelixCustomReward) {
		const result = new ChannelPointReward()

		result._id = reward.id

		result._config = {
			controllable: false,
			transient: false,
		} as ChannelPointRewardConfig

		await result.updateConfig(reward)

		await this.storage.inject(result)

		return result
	}

	private async updateConfig(r: HelixCustomReward) {
		await super.applyConfig({
			twitchId: r.id,

			name: r.title,
			backgroundColor: r.backgroundColor as Color,
			prompt: r.prompt,
			userInputRequired: r.userInputRequired,
			cost: r.cost,
			skipQueue: r.autoFulfill,
			cooldown: r.globalCooldown ?? undefined,
			image: r.getImageUrl(4),

			maxRedemptionsPerStream: r.maxRedemptionsPerStream ?? undefined,
			maxRedemptionsPerUserPerStream: r.maxRedemptionsPerUserPerStream ?? undefined,
		})
	}

	async updateOrCreateReward(refReward?: HelixCustomReward) {
		if (!this.config.controllable) throw new Error("Can't update a non-controllable reward")

		const rewardData: HelixCreateCustomRewardData = {
			title: this.config.name,
			cost: this.config.cost,
			prompt: this.config.prompt,
			backgroundColor: this.config.backgroundColor,
			isEnabled: true, //TODO: ?
			userInputRequired: this.config.userInputRequired,
			maxRedemptionsPerStream: this.config.maxRedemptionsPerStream,
			maxRedemptionsPerUserPerStream: this.config.maxRedemptionsPerUserPerStream,
			globalCooldown: this.config.cooldown,
			autoFulfill: this.config.skipQueue,
		}

		console.log("createOrUpdate", this.config.name)

		if (this.config.twitchId) {
			if (!needsUpdate(refReward, rewardData)) return
			//console.log("Updating Reward", rewardData)
			const update = await TwitchAccount.channel.apiClient.channelPoints.updateCustomReward(
				TwitchAccount.channel.clientId,
				this.config.twitchId,
				rewardData
			)
			await this.updateConfig(update)
		} else {
			if (refReward) {
				throw new Error("You shouldn't have a ref reward")
			}
			//console.log("Creating Reward", rewardData)

			const created = await TwitchAccount.channel.apiClient.channelPoints.createCustomReward(
				TwitchAccount.channel.twitchId,
				rewardData
			)
			await this.updateConfig(created)
		}
	}
}

export function setupChannelPointRewards() {
	onLoad(() => {
		ChannelPointReward.initialize()
	})

	async function clearNonCastMateRewards() {
		const ids = new Set<string>()

		for (const reward of ChannelPointReward.storage) {
			if (!reward.config.controllable) ids.add(reward.id)
		}

		for (const id of ids) {
			await ChannelPointReward.storage.remove(id)
		}
	}

	async function loadRewards() {
		const channelAccount = TwitchAccount.channel

		const channelId = channelAccount.config.twitchId

		await clearNonCastMateRewards()

		//Unforunately there's no way to query for rewards not controlled by this client id
		//We can only query for all rewards and rewards we control
		//Query both.
		const rewards = await channelAccount.apiClient.channelPoints.getCustomRewards(channelId)
		const castMateRewards = await channelAccount.apiClient.channelPoints.getCustomRewards(channelId, true)

		//Filter for non-castmate controllable rewards
		const nonCastMateRewards = rewards.filter((r) => castMateRewards.find((o) => o.id == r.id) == null)

		//Load all the non-castmate rewards into resources
		await Promise.all(nonCastMateRewards.map((r) => ChannelPointReward.createNonCastmateReward(r)))

		for (const reward of castMateRewards) {
			const cpr = ChannelPointReward.getByTwitchId(reward.id)

			//This reward is controllable but doesn't have a locally stored resource, create it now
			if (!cpr) {
				await ChannelPointReward.recoverLocalReward(reward)
				//Add this to the reward list so we handle it properly in the next step
			}
		}

		for (const reward of ChannelPointReward.storage) {
			if (!reward.config.controllable) continue

			const twitchReward = castMateRewards.find((r) => r.id == reward.config.twitchId)

			if (!twitchReward) {
				console.log("Unable to find reward for", reward.config.name)
				//Because we're loading, if this reward doesn't have a twitch reward equivalent we zero it out
				//That way updateOrCreate() knows to create it
				await reward.applyConfig({ twitchId: null })
			}

			if (!reward.config.transient || twitchReward) {
				//Update the reward if it's not transient, or if it's transient and exists on twitch's servers
				await reward.updateOrCreateReward(twitchReward)
			}
		}
	}

	onChannelAuth(async (channel, service) => {
		await loadRewards()

		service.eventsub.onChannelRedemptionAdd(channel.twitchId, async (event) => {
			const reward = ChannelPointReward.getByTwitchId(event.rewardId)
			if (!reward) {
				console.error("Redemption for reward that doesn't have a resource!")
				return
			}
			redemption({
				reward,
				redemptionId: event.id,
				user: event.userDisplayName,
				userId: event.userId,
				userColor: await ViewerCache.getInstance().getChatColor(event.userId),
				message: event.input,
			})
		})
	})

	const redemption = defineTrigger({
		id: "redemption",
		name: "Channel Point Reward",
		version: "0.0.1",
		icon: "twi twi-channel-points",
		config: {
			type: Object,
			properties: {
				reward: { type: ChannelPointReward, name: "Reward", required: true },
				group: { type: TwitchViewerGroup, name: "Viewer Group", required: true, default: {} },
			},
		},
		context: {
			type: Object,
			properties: {
				reward: { type: ChannelPointReward, required: true },
				redemptionId: { type: String, required: true },
				user: { type: String, required: true },
				userId: { type: String, required: true },
				userColor: { type: String, required: true },
				message: { type: String, required: true },
			},
		},
		async handle(config, context) {
			if (config.reward.id != context.reward.id) {
				return false
			}

			if (!(await inTwitchViewerGroup(context.userId, config.group))) {
				return false
			}

			return true
		},
	})
}
