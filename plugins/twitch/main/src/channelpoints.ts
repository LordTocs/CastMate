import {
	ReactiveEffect,
	Resource,
	ResourceStorage,
	defineResourceSetting,
	defineTrigger,
	onLoad,
	onProfilesChanged,
	runOnChange,
	template,
	templateSchema,
} from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import { Color } from "castmate-schema"
import {
	ChannelPointRewardConfig,
	ChannelPointRewardData,
	ChannelPointRewardSchema,
	ChannelPointRewardState,
	ChannelPointRewardTemplate,
	TwitchViewerGroup,
} from "castmate-plugin-twitch-shared"
import { EventSubChannelRewardEvent } from "@twurple/eventsub-base"
import { HelixCreateCustomRewardData, HelixCustomReward } from "@twurple/api"
import { nanoid } from "nanoid/non-secure"
import { onChannelAuth } from "./api-harness"
import { ViewerCache } from "./viewer-cache"
import { inTwitchViewerGroup } from "./group"
import { getRawData } from "@twurple/common"
import * as fs from "fs/promises"
import * as path from "path"
import { ensureDirectory, loadYAML, resolveProjectPath, writeYAML } from "castmate-core/src/io/file-system"
import _debounce from "lodash/debounce"
import { PluginManager } from "castmate-core/src/plugins/plugin-manager"

//Helper interface to work with both EventSubChannelRewardEvent and HelixCustomReward
interface TwurpleReward {
	readonly id: string
	readonly broadcasterId: string
	readonly broadcasterName: string
	readonly broadcasterDisplayName: string
	getImageUrl(scale: 1 | 2 | 4): string
	readonly backgroundColor: string
	readonly isEnabled: boolean
	readonly cost: number
	readonly title: string
	readonly prompt: string
	readonly userInputRequired: boolean
	readonly maxRedemptionsPerStream: number | null
	readonly maxRedemptionsPerUserPerStream: number | null
	readonly globalCooldown: number | null
	readonly isPaused: boolean
	readonly isInStock: boolean
	readonly redemptionsThisStream: number | null
	//Note the different names here.
	readonly autoFulfill?: boolean
	readonly autoApproved?: boolean

	readonly cooldownExpiryDate: Date | null
}

function helixNeedsUpdate(reward: TwurpleReward | undefined, data: HelixCreateCustomRewardData) {
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

function rewardDataFromTwurple(reward: TwurpleReward): ChannelPointRewardData {
	return {
		title: reward.title,
		backgroundColor: reward.backgroundColor as Color,
		prompt: reward.prompt,
		userInputRequired: reward.userInputRequired,
		cost: reward.cost,
		skipQueue: reward.autoFulfill ?? reward.autoApproved ?? false,
		cooldown: reward.globalCooldown ?? undefined,

		maxRedemptionsPerStream: reward.maxRedemptionsPerStream ?? undefined,
		maxRedemptionsPerUserPerStream: reward.maxRedemptionsPerUserPerStream ?? undefined,
	}
}

function removeTitle<T extends { title: string }>(titleHaver: T): Omit<T, "title"> {
	const result = { ...titleHaver }
	delete (result as { title?: string }).title
	return result
}

interface ChannelPointRewardConstructor {
	new (...args: any): ChannelPointReward
	resourceDirectory: string
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
				controllable: true,
				transient: false,
			}
		}

		this.state = {
			enabled: false,
			shouldEnable: false,
			//cooldownExpiry: null,
			inStock: true,
		}
	}

	get directory() {
		return (this.constructor as ChannelPointRewardConstructor).resourceDirectory
	}

	get filename() {
		return `${this.id}.yaml`
	}

	get filepath() {
		return resolveProjectPath(this.directory, this.filename)
	}

	async load(config: ChannelPointRewardConfig) {
		await super.setConfig(config)
		return true
	}

	async save() {
		if (!this.config.controllable) return

		await writeYAML(this.config, this.filepath)
	}

	async applyConfig(config: Partial<ChannelPointRewardConfig>): Promise<boolean> {
		await super.applyConfig(config)
		await this.updateTwitchServers()
		await this.initializeReactivity()
		await this.save()
		return true
	}

	async setConfig(config: ChannelPointRewardConfig): Promise<boolean> {
		await super.setConfig(config)
		await this.updateTwitchServers()
		await this.initializeReactivity()
		await this.save()
		return true
	}

	static async create(config: ChannelPointRewardConfig) {
		const reward = new ChannelPointReward()
		reward._id = nanoid()
		reward._config = {
			twitchId: "",
			controllable: true,
			transient: false,
			name: config.name,
			allowEnable: config.allowEnable,
			rewardData: config.rewardData,
		}
		reward.state = {
			enabled: false,
			shouldEnable: false,
			//cooldownExpiry: null,
			inStock: true,
		}
		await reward.updateTwitchServers()
		await reward.initializeReactivity()
		return reward
	}

	static async onCreate(resource: ChannelPointReward) {
		await resource.save()
	}

	static async onDelete(resource: ChannelPointReward) {
		if (resource.config.controllable && resource.config.twitchId) {
			await TwitchAccount.channel.apiClient.channelPoints.deleteCustomReward(
				TwitchAccount.channel.twitchId,
				resource.config.twitchId
			)
		}
		await fs.unlink(resource.filepath)
	}

	static async initialize() {
		await super.initialize()

		const resolvedDir = resolveProjectPath(this.resourceDirectory)
		ensureDirectory(resolvedDir)
		const files = await fs.readdir(resolvedDir)

		const fileLoadPromises = files.map(async (file) => {
			const id = path.basename(file, ".yaml")
			console.log("Loading", this.storage.name, id)
			const fullFile = path.join(resolvedDir, file)

			try {
				const data = await loadYAML(fullFile)
				const resource = new this()
				resource._id = id

				if ((await resource.load(data)) === false) {
					console.error("Load Failed", id)
					return undefined
				}

				return resource
			} catch (err) {
				console.error("Load Errored", id, err)
				return undefined
			}
		})

		const resources = (await Promise.all(fileLoadPromises)).filter((r) => r != undefined) as ChannelPointReward[]
		this.storage.inject(...resources)
	}

	//Called when we discover a CastMate controlled reward that doesn't have a resource
	static async recoverLocalReward(reward: TwurpleReward) {
		console.log("Recovering ", reward.title)
		const rewardData = rewardDataFromTwurple(reward)

		const result = new ChannelPointReward()

		result._id = nanoid()
		result._config = {
			twitchId: reward.id,
			controllable: true,
			transient: false,
			name: reward.title,
			allowEnable: true,
			rewardData: removeTitle(rewardData),
		}
		result.state.image = reward.getImageUrl(4)
		result.state.rewardData = {
			...rewardData,
		}

		await result.save()
		await this.storage.inject(result)

		return result
	}

	static async createNonCastmateReward(reward: HelixCustomReward) {
		const result = new ChannelPointReward()

		const rewardData = rewardDataFromTwurple(reward)

		result._id = reward.id
		result._config = {
			name: reward.title,
			twitchId: reward.id,
			controllable: false,
			transient: false,
			allowEnable: true,
			rewardData: removeTitle(rewardData),
		} as ChannelPointRewardConfig

		result.state = {
			enabled: reward.isEnabled,
			shouldEnable: reward.isEnabled,
			image: reward.getImageUrl(4),
			rewardData,
			inStock: reward.isInStock,
			//cooldownExpiry: reward.cooldownExpiryDate,
		}

		await this.storage.inject(result)

		return result
	}

	async updateFromTwurple(reward: TwurpleReward) {
		if (this.config.twitchId != reward.id) {
			await super.applyConfig({
				twitchId: reward.id,
			})
		}

		this.state.enabled = reward.isEnabled
		this.state.image = reward.getImageUrl(4)
		this.state.rewardData = rewardDataFromTwurple(reward)

		if (!this.config.controllable) {
			//Update the config if it's a non-controllable
			await super.applyConfig({
				name: reward.title,
				rewardData: removeTitle(rewardDataFromTwurple(reward)),
			})
		}
	}

	private async getHelixRewardData(): Promise<HelixCreateCustomRewardData> {
		const resolvedData = await templateSchema(
			{
				title: this.config.name,
				...this.config.rewardData,
			},
			ChannelPointRewardSchema,
			PluginManager.getInstance().state
		)

		const rewardData: HelixCreateCustomRewardData = {
			title: resolvedData.title,
			cost: resolvedData.cost,
			prompt: resolvedData.prompt,
			backgroundColor: resolvedData.backgroundColor,
			isEnabled: this.state.shouldEnable && this.config.allowEnable,
			userInputRequired: resolvedData.userInputRequired,
			maxRedemptionsPerStream: resolvedData.maxRedemptionsPerStream,
			maxRedemptionsPerUserPerStream: resolvedData.maxRedemptionsPerUserPerStream,
			globalCooldown: resolvedData.cooldown,
			autoFulfill: resolvedData.skipQueue,
		}

		return rewardData
	}

	async initializeFromTwurple(reward?: TwurpleReward) {
		const expectedHelixData = await this.getHelixRewardData()

		if (!reward || !this.config.twitchId) {
			//We didn't find an equivalent reward at twitch. Create One
			if (this.config.transient) return //Transient rewards don't need to exist

			console.log("Reward Found in files but not on twitch")
			console.log(expectedHelixData.title)

			const created = await TwitchAccount.channel.apiClient.channelPoints.createCustomReward(
				TwitchAccount.channel.twitchId,
				expectedHelixData
			)

			await this.updateFromTwurple(created)
			return
		}

		if (!helixNeedsUpdate(reward, expectedHelixData)) {
			//The twitch servers already contain the data we want them to. Just update our state
			await this.updateFromTwurple(reward)
		} else {
			const update = await TwitchAccount.channel.apiClient.channelPoints.updateCustomReward(
				TwitchAccount.channel.twitchId,
				this.config.twitchId,
				expectedHelixData
			)
			await this.updateFromTwurple(update)
		}
	}

	private reactiveEffect: ReactiveEffect<any> | undefined
	clearReactivity() {
		if (this.reactiveEffect) {
			this.reactiveEffect.dispose()
			this.reactiveEffect = undefined
		}
	}

	private updateServerDebounced = _debounce(async () => {
		//console.log("Debounced Twurple Reward Update")
		await this.updateTwitchServers()
	}, 300)

	async initializeReactivity() {
		//console.log("Initializing Reactivity", this.id)
		this.clearReactivity()
		this.reactiveEffect = await runOnChange(async () => await this.getHelixRewardData(), this.updateServerDebounced)
	}

	private async updateTwitchServers() {
		if (!this.config.controllable) return
		if (this.config.transient) return

		const helixData = await this.getHelixRewardData()
		if (this.config.twitchId) {
			const update = await TwitchAccount.channel.apiClient.channelPoints.updateCustomReward(
				TwitchAccount.channel.twitchId,
				this.config.twitchId,
				helixData
			)
			await this.updateFromTwurple(update)
		} else {
			console.log("Update Twitch Servers Create")
			const created = await TwitchAccount.channel.apiClient.channelPoints.createCustomReward(
				TwitchAccount.channel.twitchId,
				helixData
			)
			await this.updateFromTwurple(created)
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

			await reward.initializeFromTwurple(twitchReward)
			await reward.initializeReactivity()
		}
	}

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
				user: { type: String, required: true, default: "LordTocs" },
				userId: { type: String, required: true, default: "27082158" },
				userColor: { type: String, required: true, default: "#4411FF" },
				message: { type: String, required: true, default: "Thanks for using CastMate!" },
			},
		},
		async handle(config, context) {
			//console.log("Redemption Check", config.reward.id, context.reward.id)
			if (config.reward.id != context.reward.id) {
				return false
			}

			if (!(await inTwitchViewerGroup(context.userId, config.group))) {
				return false
			}

			return true
		},
	})

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

		service.eventsub.onChannelRewardUpdate(channel.twitchId, async (event) => {
			const resource = ChannelPointReward.getByTwitchId(event.id)
			await resource?.updateFromTwurple(event)
		})

		service.eventsub.onChannelRewardRemove(channel.twitchId, async (event) => {
			const resource = ChannelPointReward.getByTwitchId(event.id)

			if (!resource) return
			if (!resource.config.controllable) {
				await ChannelPointReward.storage.remove(resource.id)
				return
			}

			//If it's controllable and it was deleted either
			// A) The user deleted it from the dashboard. We'll recreate it
			//     TODO: Recreated dashboard deleted channel points
			// B) The user deleted the resource, so it's already removed.
		})

		service.eventsub.onChannelRewardAdd(channel.twitchId, async (event) => {
			const resource = ChannelPointReward.getByTwitchId(event.id)

			if (resource) return //HUH?
			//How do we know if this is from our resource creation or
		})
	})

	onProfilesChanged((activeProfiles, inactiveProfiles) => {
		const activeRewards = new Set<string>()

		for (const profile of activeProfiles) {
			for (const trigger of profile.config.triggers) {
				if (trigger.plugin == "twitch" && trigger.trigger == "redemption") {
					console.log("Redemption Trigger", trigger.config.reward)
					activeRewards.add(trigger.config.reward)
				}
			}
		}

		console.log("Active Reward Ids", [...activeRewards])

		for (const reward of ChannelPointReward.storage) {
			if (!reward.config.controllable) continue

			if (activeRewards.has(reward.id)) {
				//TODO: Make the state system handle this
				if (!reward.state.shouldEnable) {
					reward.state.shouldEnable = true
				}
			} else {
				if (reward.state.shouldEnable) {
					reward.state.shouldEnable = false
				}
			}
		}
	})
}
