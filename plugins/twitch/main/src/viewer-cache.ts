import { ChatUser } from "@twurple/chat"
import { Service, onLoad } from "castmate-core"
import { Color } from "castmate-schema"
import { TwitchAccount } from "./twitch-auth"
import { onChannelAuth } from "./api-harness"
import { EventSubChannelSubscriptionEvent } from "@twurple/eventsub-base"

interface CachedViewerSubInfo {
	tier: 1 | 2 | 3
	gift: boolean
}

interface CachedViewerInfo {
	id: string
	displayName?: string
	color?: Color | "default"
	following?: boolean
	followDate?: Date
	subbed?: boolean
	subinfo?: CachedViewerSubInfo
}

function getNValues<T>(set: Set<T>, requiredValue: T, n: number): T[] {
	const result = [requiredValue]

	let count = 0
	for (const v of set) {
		if (v === requiredValue) {
			continue
		}
		result.push(v)
		count++
		if (count >= n) {
			break
		}
	}

	return result
}

function removeValues<T>(set: Set<T>, values: T[]) {
	for (const v of values) {
		set.delete(v)
	}
}

function enforce<T>(set: Set<T>, value: T, contained: boolean) {
	if (contained) {
		set.add(value)
	} else {
		set.delete(value)
	}
}

/*
We want to be able to query at any time if a user meets certain criteria.

However, firing off an API query every time is a bad idea.

Thus we need to cache viewer information as we go and use the batch querying to update it.

TODO: DataRaces. If two triggers run for batched users it will query twitch twice.
*/

export function setupViewerCache() {
	onLoad(() => {
		ViewerCache.initialize()
	})

	onChannelAuth(async () => {
		await ViewerCache.getInstance().resetCache()
	})
}

export const ViewerCache = Service(
	class {
		//VIPS and MODS are limited thus it makes sense to store a set and prime it
		private vips = new Set<string>()
		private mods = new Set<string>()

		private _viewerLookup = new Map<string, CachedViewerInfo>()
		private _nameLookup = new Map<string, CachedViewerInfo>()

		//Colors and SubInfo could be too numerous to prime so we'll lazily collect ids to query
		private unknownColors = new Set<string>()
		private unknownSubInfo = new Set<string>()

		//Twitch doesn't allow bulk follow checking?
		//private unknownFollows = new Set<string>()

		constructor() {}

		async resetCache() {
			this._nameLookup = new Map()
			this._viewerLookup = new Map()
			this.unknownColors = new Set()
			this.unknownSubInfo = new Set()
			this.vips = new Set()
			this.mods = new Set()

			const [vips, mods] = await Promise.all([
				TwitchAccount.channel.apiClient.channels.getVipsPaginated(TwitchAccount.channel.twitchId).getAll(),
				TwitchAccount.channel.apiClient.moderation
					.getModeratorsPaginated(TwitchAccount.channel.twitchId)
					.getAll(),
			])
			for (const vip of vips) {
				this.vips.add(vip.id)
			}
			for (const mod of mods) {
				this.mods.add(mod.userId)
			}
		}

		private get(userId: string) {
			const cached = this._viewerLookup.get(userId)
			if (!cached) throw new Error("Tried to get user out of cache that hasn't been cached")
			return cached
		}

		private getOrCreate(userId: string) {
			let cached = this._viewerLookup.get(userId)
			if (!cached) {
				cached = { id: userId }
				this._viewerLookup.set(userId, cached)
				this.unknownColors.add(userId)
				this.unknownSubInfo.add(userId)
			}
			return cached
		}

		private async queryColor(userId: string) {
			const ids = getNValues(this.unknownColors, userId, 100)
			try {
				const colors = await TwitchAccount.channel.apiClient.chat.getColorsForUsers(ids)

				for (const [id, color] of colors) {
					//TODO: Default color for the unchosen
					this.get(id).color = (color as Color) ?? "default"
				}

				removeValues(this.unknownColors, ids)
			} catch (err) {}
		}

		async getChatColor(userId: string): Promise<Color | "default"> {
			const cached = this.getOrCreate(userId)
			if (cached.color != null) {
				return cached.color
			}

			await this.queryColor(userId)

			return cached.color ?? "default"
		}

		updateNameCache(viewer: CachedViewerInfo, name: string) {
			if (viewer.displayName != name) {
				const nameLower = name.toLowerCase()
				if (viewer.displayName != null) {
					this._nameLookup.delete(nameLower)
				}

				viewer.displayName = name

				this._nameLookup.set(nameLower, viewer)
			}
		}

		cacheChatUser(chatUser: ChatUser) {
			const id = chatUser.userId
			const cached = this.getOrCreate(id)

			this.updateNameCache(cached, chatUser.displayName)

			cached.color = (chatUser.color as Color) ?? "default"
			this.unknownColors.delete(id)

			enforce(this.vips, id, chatUser.isVip)
			enforce(this.mods, id, chatUser.isMod)

			cached.subbed = chatUser.isSubscriber
			if (!cached.subbed) {
				delete cached.subinfo
				this.unknownSubInfo.delete(id)
			}
		}

		cacheSubEvent(event: EventSubChannelSubscriptionEvent) {
			const cached = this.getOrCreate(event.userId)
			this.updateNameCache(cached, event.userDisplayName)
			cached.subbed = true
			cached.subinfo = {
				gift: false,
				tier: (Number(event.tier) / 1000) as 1 | 2 | 3,
			}
		}

		setFollowState(userId: string, following: boolean) {
			this.getOrCreate(userId).following = following
		}

		private async queryFollowing(userId: string) {
			try {
				//Annoyingly check each follow independently
				const cached = this.get(userId)
				const following = await TwitchAccount.channel.apiClient.channels.getChannelFollowers(
					TwitchAccount.channel.twitchId,
					userId
				)
				if (following.data.length == 0) {
					cached.following = false
					delete cached.followDate
					return
				}

				this.updateNameCache(cached, following.data[0].userDisplayName)
				cached.following = true
				cached.followDate = following.data[0].followDate
			} catch (err) {}
		}

		async getIsFollowing(userId: string): Promise<boolean> {
			const cached = this.getOrCreate(userId)
			if (cached.following != null) {
				return cached.following
			}
			await this.queryFollowing(userId)
			return cached.following ?? false
		}

		async getFollowDate(userId: string): Promise<Date | undefined> {
			const cached = this.getOrCreate(userId)
			if (cached.following != null) {
				return cached.followDate
			}
			await this.queryFollowing(userId)
			return cached.followDate
		}

		async getIsVIP(userId: string): Promise<boolean> {
			return this.vips.has(userId)
		}

		async getIsMod(userId: string): Promise<boolean> {
			return this.mods.has(userId)
		}

		setIsMod(userId: string, isMod: boolean) {
			enforce(this.mods, userId, isMod)
		}

		private async querySubInfo(userId: string) {
			const ids = getNValues(this.unknownSubInfo, userId, 100)

			try {
				const subs = await TwitchAccount.channel.apiClient.subscriptions.getSubscriptionsForUsers(
					TwitchAccount.channel.twitchId,
					ids
				)

				const leftOvers = new Set(ids)

				for (const sub of subs) {
					leftOvers.delete(sub.userId)

					const cached = this.get(userId)
					this.updateNameCache(cached, sub.userDisplayName)

					cached.subbed = true
					cached.subinfo = {
						tier: sub.tier === "3000" ? 3 : sub.tier === "2000" ? 2 : 1,
						gift: sub.isGift,
					}
				}

				for (const id of leftOvers) {
					const cached = this.get(id)
					cached.subbed = false
					delete cached.subinfo
				}

				removeValues(this.unknownSubInfo, ids)
			} catch (err) {}
		}

		async getIsSubbed(userId: string) {
			const cached = this.getOrCreate(userId)
			if (cached.subbed != null) {
				return cached.subbed
			}
			await this.querySubInfo(userId)
			return cached.subbed ?? false
		}

		async getSubInfo(userId: string) {
			const cached = this.get(userId)
			if (cached.subinfo != null) {
				return cached.subinfo
			}
			if (cached.subbed == false) {
				return undefined
			}

			await this.querySubInfo(userId)
			return cached.subinfo
		}

		async getUserId(name: string) {
			if (name.startsWith("@")) {
				name = name.substring(1)
			}
			const nameLower = name.toLowerCase()
			let existing = this._nameLookup.get(nameLower)
			if (existing) return existing.id

			const user = await TwitchAccount.channel.apiClient.users.getUserByName(name)

			if (user == null) return undefined
			existing = this.getOrCreate(user.id)

			this.updateNameCache(existing, user.displayName)
			return existing.id
		}
	}
)
