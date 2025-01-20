import { ChatUser } from "@twurple/chat"
import {
	EventList,
	ReactiveRef,
	Service,
	ViewerData,
	defineRendererCallable,
	isCastMate,
	isSatellite,
	measurePerf,
	measurePerfFunc,
	onLoad,
	onUnload,
	reactiveRef,
	registerSchemaExpose,
	registerSchemaTemplate,
	registerSchemaUnexpose,
	startPerfTime,
	template,
	usePluginLogger,
} from "castmate-core"
import { Color, getTypeByConstructor } from "castmate-schema"
import { TwitchAccount } from "./twitch-auth"
import { onChannelAuth } from "./api-harness"
import {
	EventSubChannelSubscriptionEvent,
	EventSubChannelSubscriptionGiftEvent,
	EventSubChannelFollowEvent,
	EventSubChannelCheerEvent,
} from "@twurple/eventsub-base"
import { rawDataSymbol } from "@twurple/common"
import fuzzysort from "fuzzysort"
import { defineCallableIPC } from "castmate-core/src/util/electron"
import {
	SchemaTwitchViewer,
	TwitchViewer,
	TwitchViewerData,
	TwitchViewerDisplayData,
	TwitchViewerUnresolved,
} from "castmate-plugin-twitch-shared"
import { nextTick } from "process"
import { HelixChannelFollower, HelixPaginatedResultWithTotal } from "@twurple/api"

const logger = usePluginLogger("twitch")

interface CachedTwitchViewer extends Partial<TwitchViewerData> {
	id: string
	[Symbol.toPrimitive](hint: "default" | "string" | "number"): any
	lastSeen?: number
	[key: string]: any
}

function getNValues<T>(set: Set<T>, requiredValues: T[], n: number): T[] {
	requiredValues = requiredValues.filter((id) => id != "anonymous")

	const result = [...requiredValues]

	if (result.length >= n) {
		result.splice(n, result.length - n)
		return result
	}

	for (const v of set) {
		if (requiredValues.includes(v)) {
			continue
		}
		result.push(v)
		if (result.length >= n) {
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
	defineRendererCallable("fuzzyGetUsers", async (query: string) => {
		return await ViewerCache.getInstance().fuzzyGetDisplayDataByName(query, 10)
	})

	defineRendererCallable("getUserById", async (userId: string) => {
		return await ViewerCache.getInstance().getDisplayDataById(userId)
	})

	defineRendererCallable("getUsersByIds", async (userIds: string[]) => {
		return await ViewerCache.getInstance().getDisplayDatasByIds(userIds)
	})

	defineRendererCallable("getUserByName", async (name: string) => {
		if (!name) return undefined

		return await ViewerCache.getInstance().getDisplayDataByName(name)
	})

	onChannelAuth(async () => {
		const perf = startPerfTime("Viewer Cache Init")
		await ViewerCache.getInstance().resetCache()
		perf.stop(logger)
	})
}

registerSchemaExpose(TwitchViewer, async (value: TwitchViewerUnresolved) => {
	return await ViewerCache.getInstance().getResolvedViewer(value)
})

registerSchemaUnexpose(TwitchViewer, async (value: TwitchViewer) => {
	return value?.id
})

registerSchemaTemplate(
	TwitchViewer,
	async (value: TwitchViewerUnresolved, context: any, schema: SchemaTwitchViewer) => {
		if (isDefinitelyNotTwitchId(value)) {
			//We know this is a template string, so template the value to a name and then get the userId from it
			const resultName = await template(value, context)
			return await ViewerCache.getInstance().getUserId(resultName)
		}

		if (await ViewerCache.getInstance().validateUserId(value)) {
			return value
		} else {
			return await ViewerCache.getInstance().getUserId(value)
		}
	}
)

//Twitch IDs only contain numbers, so if it has any non-number it must be a username.
//BUT a twitch username CAN be only numbers. So we can't write an isTwitchId() without running an API query
function isDefinitelyNotTwitchId(maybeId: string) {
	const nonDigits = /\D/g
	return maybeId.match(nonDigits) != null
}

export const ViewerCache = Service(
	class {
		//VIPS and MODS are limited thus it makes sense to store a set and prime it
		private vips = new Set<string>()
		private mods = new Set<string>()

		private viewerLookup = new Map<string, ReactiveRef<CachedTwitchViewer>>()
		private nameLookup = new Map<string, CachedTwitchViewer>()

		//Colors and SubInfo could be too numerous to prime so we'll lazily collect ids to query
		private unknownColors = new Set<string>()
		private unknownSubInfo = new Set<string>()
		private unknownUserInfo = new Set<string>()
		private unknownViewerData = new Set<string>()

		private chatters = new Map<string, CachedTwitchViewer>()
		private chatterQueryTimer: NodeJS.Timeout | undefined = undefined

		//Twitch doesn't allow bulk follow checking?
		//private unknownFollows = new Set<string>()

		onViewerSeen = new EventList<(viewer: TwitchViewerUnresolved) => any>()

		constructor() {
			if (isCastMate()) {
				ViewerData.getInstance()?.registerProvider({
					id: "twitch",
					onDataChanged: async (id, column, value) => {
						const cached = this.getOrCreate(id)
						cached[column] = value
					},
					onColumnAdded: async (column, defaultValue) => {
						for (const cached of this.viewerLookup.values()) {
							cached.value[column] = defaultValue
						}
					},
					onColumnRemoved: async (column) => {
						for (const cached of this.viewerLookup.values()) {
							delete cached.value[column]
						}
					},
				})
			}
		}

		async resetCache() {
			this.nameLookup = new Map()
			this.viewerLookup = new Map()
			this.unknownColors = new Set()
			this.unknownSubInfo = new Set()
			this.unknownUserInfo = new Set()
			this.unknownViewerData = new Set()
			this.vips = new Set()
			this.mods = new Set()
			this.chatters = new Map()

			if (isSatellite()) return

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

			if (this.chatterQueryTimer) {
				clearTimeout(this.chatterQueryTimer)
				this.chatterQueryTimer = undefined
			}

			await this.updateChatterList()
			this.chatterQueryTimer = setTimeout(() => this.updateChatterList(), 60000)
		}

		//@measurePerf
		private async updateChatterList() {
			if (isSatellite()) return
			return await measurePerfFunc(async () => {
				const newChatters = new Map<string, CachedTwitchViewer>()

				//TODO: Check if the bot account is active and has moderator privledges, that would give us a guilt free 800 queries

				// Each page can be 1000, so theoretically this will break everything if you have close to 800,000 concurrent viewers
				// So.. for now we won't worry about it, but if we get some sort of huge event using it... Put some work in here?
				const query = TwitchAccount.channel.apiClient.chat.getChattersPaginated(TwitchAccount.channel.twitchId)
				for await (const chatter of query) {
					const cached = this.getOrCreate(chatter.userId)
					this.updateNameCache(cached, chatter.userDisplayName)
					cached.lastSeen = Date.now()
					newChatters.set(chatter.userId, cached)
				}

				this.chatters = newChatters
			}, "updateChatterList")()
		}

		private get(userId: string) {
			const cached = this.viewerLookup.get(userId)
			if (!cached) throw new Error("Tried to get user out of cache that hasn't been cached")
			return cached.value
		}

		private markSeen(viewer: CachedTwitchViewer) {
			viewer.lastSeen = Date.now()
			if (!this.chatters.has(viewer.id)) {
				this.chatters.set(viewer.id, viewer)
			}

			this.onViewerSeen.run(viewer.id)
		}

		private getOrCreate(userId: string) {
			if (userId == "") throw new Error("No empty IDs!")
			if (userId == "anonymous") throw new Error("No anonymous!")
			if (isDefinitelyNotTwitchId(userId)) throw new Error("Invalid ID!")

			let cached = this.viewerLookup.get(userId)
			if (!cached) {
				//Store our users as reactive so if they get used in a condition or overlay template they will update it
				//when the cache is updated
				cached = reactiveRef<CachedTwitchViewer>({
					id: userId,
					[Symbol.toPrimitive](hint: "default" | "string" | "number") {
						if (hint == "string") return this.displayName ?? this.id
						return 0
					},
				})
				this.viewerLookup.set(userId, cached)
				this.unknownColors.add(userId)
				this.unknownSubInfo.add(userId)
				this.unknownUserInfo.add(userId)
				this.unknownViewerData.add(userId)
			}
			return cached.value
		}

		private async queryColor(...userIds: string[]) {
			const perf1 = startPerfTime("Query Color User Gather")
			const ids = getNValues(this.unknownColors, userIds, 100)
			perf1.stop(logger)

			try {
				const perf2 = startPerfTime(`Run Query Color ${ids.length}`)
				const colors = await TwitchAccount.channel.apiClient.chat.getColorsForUsers(ids)
				perf2.stop(logger)

				const perf3 = startPerfTime("Update Colors")
				for (const [id, color] of colors) {
					//TODO: Default color for the unchosen
					this.get(id).color = (color as Color) ?? "default"
				}

				removeValues(this.unknownColors, ids)
				perf3.stop(logger)
			} catch (err) {
				logger.error("Error Querying Colors!", err)
				logger.error("IDS", ids)
			}
		}

		async getChatColor(userId: string): Promise<Color | "default"> {
			if (userId == "anonymous") return "default"

			const cached = this.getOrCreate(userId)
			if (cached.color != null) {
				return cached.color
			}

			await this.queryColor(userId)

			return cached.color ?? "default"
		}

		updateNameCache(viewer: CachedTwitchViewer, name: string) {
			if (viewer.displayName != name) {
				const nameLower = name.toLowerCase()
				if (viewer.displayName != null) {
					this.nameLookup.delete(nameLower)
				}

				viewer.displayName = name

				this.nameLookup.set(nameLower, viewer)
			}
		}

		cacheChatUser(chatUser: ChatUser) {
			const id = chatUser.userId
			const cached = this.getOrCreate(id)

			this.markSeen(cached)

			this.updateNameCache(cached, chatUser.displayName)

			cached.color = (chatUser.color as Color) ?? "default"
			this.unknownColors.delete(id)

			enforce(this.vips, id, chatUser.isVip)
			enforce(this.mods, id, chatUser.isMod)

			cached.subbed = chatUser.isSubscriber
			if (!cached.subbed) {
				delete cached.sub
				this.unknownSubInfo.delete(id)
			}
		}

		cacheSubEvent(event: EventSubChannelSubscriptionEvent) {
			const cached = this.getOrCreate(event.userId)
			this.updateNameCache(cached, event.userDisplayName)
			this.markSeen(cached)
			cached.subbed = true
			const tier = (Number(event.tier) / 1000) as 1 | 2 | 3
			cached.sub = {
				gift: event.isGift,
				tier,
			}
			this.unknownSubInfo.delete(cached.id)
		}

		cacheCheerEvent(event: EventSubChannelCheerEvent) {
			if (!event.userId || !event.userDisplayName) return
			const cached = this.getOrCreate(event.userId)
			this.markSeen(cached)
			this.updateNameCache(cached, event.userDisplayName)
		}

		cacheGiftSubEvent(event: EventSubChannelSubscriptionGiftEvent) {
			if (event.isAnonymous) return

			const cached = this.getOrCreate(event.gifterId)
			this.markSeen(cached)
			this.updateNameCache(cached, event.gifterDisplayName)
		}

		cacheFollowEvent(event: EventSubChannelFollowEvent) {
			const cached = this.getOrCreate(event.userId)
			this.updateNameCache(cached, event.userDisplayName)
			this.markSeen(cached)
			cached.following = true
		}

		cacheFollowQuery(resp: HelixPaginatedResultWithTotal<HelixChannelFollower>) {
			for (const follower of resp.data) {
				const cached = this.getOrCreate(follower.userId)
				this.updateNameCache(cached, follower.userDisplayName)
				cached.following = true
			}
		}

		public async userAction(userId: string) {
			const cached = this.getOrCreate(userId)
			this.markSeen(cached)
		}

		public markRelevant(userId: string) {
			this.getOrCreate(userId)
		}

		private async queryFollowing(...userIds: string[]) {
			try {
				userIds = userIds.filter((id) => id != "anonymous")

				const perf1 = startPerfTime("Running Follow Queries")

				//Annoyingly check each follow independently
				const followingPromises = userIds.map((id) =>
					TwitchAccount.channel.apiClient.channels.getChannelFollowers(TwitchAccount.channel.twitchId, id)
				)

				const followingResults = await Promise.all(followingPromises)
				perf1.stop(logger)

				const perf2 = startPerfTime("Updating Follows")

				for (let i = 0; i < userIds.length; ++i) {
					const cached = this.get(userIds[i])

					const following = followingResults[i]

					if (following.data.length == 0) {
						cached.following = false
						//delete cached.followDate
						continue
					}

					this.updateNameCache(cached, following.data[0].userDisplayName)
					cached.following = true
					//cached.followDate = following.data[0].followDate
				}
				perf2.stop(logger)
			} catch (err) {
				logger.error("Error Querying Follows", err)
				logger.error("IDS", userIds)
			}
		}

		async getIsFollowing(userId: string): Promise<boolean> {
			if (userId == "anonymous") return false

			const cached = this.getOrCreate(userId)
			if (cached.following != null) {
				return cached.following
			}
			await this.queryFollowing(userId)
			return cached.following ?? false
		}

		/*async getFollowDate(userId: string): Promise<Date | undefined> {
			const cached = this.getOrCreate(userId)
			if (cached.following != null) {
				return cached.followDate
			}
			await this.queryFollowing(userId)
			return cached.followDate
		}*/

		private async queryViewerData(...userIds: string[]) {
			const data = await ViewerData.getInstance().getMultipleViewerData("twitch", userIds)
			if (!data) return

			for (let i = 0; i < userIds.length; ++i) {
				const id = userIds[i]
				const userData = data[i]

				this.unknownViewerData.delete(id)

				if (userData == null) continue

				const cached = this.getOrCreate(id)

				Object.assign(cached, userData)
			}
		}

		async getIsVIP(userId: string): Promise<boolean> {
			return this.vips.has(userId)
		}

		async getIsMod(userId: string): Promise<boolean> {
			return this.mods.has(userId)
		}

		async getViewerData(userId: string): Promise<Record<string, any>> {
			if (userId == "anonymous") return await ViewerData.getInstance().getDefaultViewerData()

			const cached = this.getOrCreate(userId)

			if (this.unknownViewerData.has(userId)) {
				await this.queryViewerData(userId)
			}

			return cached
		}

		setIsMod(userId: string, isMod: boolean) {
			enforce(this.mods, userId, isMod)
		}

		private async querySubInfo(...userIds: string[]) {
			if (!isCastMate()) return

			const perf1 = startPerfTime("Query Subs Gather Users")
			const ids = getNValues(this.unknownSubInfo, userIds, 100)
			perf1.stop(logger)

			try {
				const perf2 = startPerfTime(`Run Query Subs ${ids.length}`)
				const subs = await TwitchAccount.channel.apiClient.subscriptions.getSubscriptionsForUsers(
					TwitchAccount.channel.twitchId,
					ids
				)
				perf2.stop(logger)

				const perf3 = startPerfTime("Update Subs")
				const leftOvers = new Set(ids)

				for (const sub of subs) {
					leftOvers.delete(sub.userId)

					const cached = this.get(sub.userId)
					this.updateNameCache(cached, sub.userDisplayName)

					cached.subbed = true
					cached.sub = {
						tier: sub.tier === "3000" ? 3 : sub.tier === "2000" ? 2 : 1,
						gift: sub.isGift,
					}
				}

				for (const id of leftOvers) {
					const cached = this.get(id)
					cached.subbed = false
					delete cached.sub
				}

				removeValues(this.unknownSubInfo, ids)
				perf3.stop(logger)
			} catch (err) {
				logger.error("Error Querying Subs!", err)
				logger.error("IDS", ids)
			}
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
			if (cached.sub != null) {
				return cached.sub
			}
			if (cached.subbed == false) {
				return undefined
			}

			await this.querySubInfo(userId)
			return cached.sub
		}

		private async queryUserInfo(...userIds: string[]) {
			const perf1 = startPerfTime("Query User Gather")
			const ids = getNValues(this.unknownUserInfo, userIds, 100)
			perf1.stop(logger)
			try {
				const perf2 = startPerfTime(`Run Get Users Query ${ids.length}`)
				const users = await TwitchAccount.channel.apiClient.users.getUsersByIds(ids)
				perf2.stop(logger)

				const perf3 = startPerfTime(`Update User Info`)
				for (const user of users) {
					const cached = this.getOrCreate(user.id)

					this.updateNameCache(cached, user.displayName)

					cached.profilePicture = user.profilePictureUrl
					cached.description = user.description

					this.unknownUserInfo.delete(user.id)
				}
				perf3.stop(logger)
			} catch (err) {
				logger.error("Error Updating Users!", err)
				logger.error("IDS", ids)
			}
		}

		async getResolvedViewer(userId: string) {
			return (await this.getResolvedViewers([userId]))[0]
		}

		async getResolvedViewers(userIds: string[]): Promise<TwitchViewer[]> {
			const perf = startPerfTime(`Resolve Viewers ${userIds.length}`)
			try {
				const neededSubIds: string[] = []
				const neededColorIds: string[] = []
				const neededUserInfoIds: string[] = []
				const neededFollowerIds: string[] = []
				const neededViewerDataIds: string[] = []

				const cachedUsers = userIds.map((id) => {
					if (id == "anonymous") return TwitchViewer.anonymous
					return this.getOrCreate(id)
				})

				for (const cached of cachedUsers) {
					if (cached.subbed == null || (cached.subbed === true && cached.sub == null)) {
						neededSubIds.push(cached.id)
					}

					if (cached.color == null) {
						neededColorIds.push(cached.id)
					}

					if (cached.profilePicture == null || cached.description == null) {
						neededUserInfoIds.push(cached.id)
					}

					if (cached.following == null) {
						neededFollowerIds.push(cached.id)
					}
				}

				const queryPromises: Promise<any>[] = []

				if (neededColorIds.length > 0) {
					logger.log("---Querying Colors:", neededColorIds.length)
					queryPromises.push(this.queryColor(...neededColorIds))
				}

				if (neededFollowerIds.length > 0) {
					logger.log("---Querying Following:", neededFollowerIds.length)
					queryPromises.push(this.queryFollowing(...neededFollowerIds))
				}

				if (neededSubIds.length > 0) {
					logger.log("---Querying Subs:", neededSubIds.length)
					queryPromises.push(this.querySubInfo(...neededSubIds))
				}

				if (neededUserInfoIds.length > 0) {
					logger.log("---Query User Infos:", neededUserInfoIds.length)
					queryPromises.push(this.queryUserInfo(...neededUserInfoIds))
				}

				if (neededViewerDataIds.length > 0) {
					queryPromises.push(this.queryViewerData(...neededViewerDataIds))
				}

				await Promise.all(queryPromises)

				//Safe to cast here since we've resolved everything
				return cachedUsers as TwitchViewer[]
			} finally {
				perf.stop(logger)
			}
		}

		async getDisplayDataByName(name: string) {
			const id = await this.getUserId(name)

			if (!id) return undefined

			return await this.getDisplayDataById(id)
		}

		async getDisplayDatasByIds(userIds: string[]): Promise<TwitchViewerDisplayData[]> {
			const users = userIds.map((id) => {
				if (id == "anonymous") return TwitchViewer.anonymous
				return this.getOrCreate(id)
			})

			const needsColors: string[] = []
			const needsUserInfo: string[] = []

			for (const user of users) {
				if (user.color == null) {
					needsColors.push(user.id)
				}

				if (user.displayName == null || user.profilePicture == null) {
					needsUserInfo.push(user.id)
				}
			}

			const queries: Promise<any>[] = []

			if (needsColors.length > 0) {
				queries.push(this.queryColor(...needsColors))
			}

			if (needsUserInfo.length > 0) {
				queries.push(this.queryUserInfo(...needsUserInfo))
			}

			await Promise.all(queries)

			return users.map((u) => ({
				id: u.id,
				displayName: u.displayName as string,
				color: u.color as Color,
				profilePicture: u.profilePicture as string,
			}))
		}

		async getDisplayDataById(userId: string): Promise<TwitchViewerDisplayData | undefined> {
			if (!userId) return undefined

			const cached = userId == "anonymous" ? TwitchViewer.anonymous : this.getOrCreate(userId)

			const queries: Promise<any>[] = []

			if (cached.color == null) {
				queries.push(this.queryColor(userId))
			}

			if (cached.displayName == null || cached.profilePicture == null) {
				queries.push(this.queryUserInfo(userId))
			}

			if (queries.length > 0) await Promise.all(queries)

			return {
				id: cached.id,
				displayName: cached.displayName as string,
				color: cached.color as Color,
				profilePicture: cached.profilePicture as string,
			}
		}

		async fuzzyGetDisplayDataByName(query: string, max: number): Promise<TwitchViewerDisplayData[]> {
			const users = await this.fuzzyUserCacheQuery(query, max)

			const needsColors: string[] = []
			const needsUserInfo: string[] = []

			for (const user of users) {
				if (user.color == null) {
					needsColors.push(user.id)
				}

				if (user.displayName == null || user.profilePicture == null) {
					needsUserInfo.push(user.id)
				}
			}

			const queries: Promise<any>[] = []

			if (needsColors.length > 0) {
				queries.push(this.queryColor(...needsColors))
			}

			if (needsUserInfo.length > 0) {
				queries.push(this.queryUserInfo(...needsUserInfo))
			}

			await Promise.all(queries)

			return users.map((u) => ({
				id: u.id,
				displayName: u.displayName as string,
				color: u.color as Color,
				profilePicture: u.profilePicture as string,
			}))
		}

		async validateUserId(userId: string) {
			const cached = this.viewerLookup.get(userId)
			if (cached) return true

			await this.queryUserInfo(userId)

			const cached2 = this.viewerLookup.get(userId)
			return cached2 != null
		}

		async getDisplayName(userId: string) {
			const cached = this.getOrCreate(userId)

			if (cached.displayName != null) return cached.displayName

			await this.queryUserInfo(userId)

			if (cached.displayName == null) throw new Error("Huh?")

			return cached.displayName
		}

		async getUserId(name: string) {
			if (name.startsWith("@")) {
				name = name.substring(1)
			}
			const nameLower = name.toLowerCase()
			let existing = this.nameLookup.get(nameLower)
			if (existing) return existing.id

			const user = await TwitchAccount.channel.apiClient.users.getUserByName(name)

			if (user == null) return undefined
			existing = this.getOrCreate(user.id)

			this.updateNameCache(existing, user.displayName)
			return existing.id
		}

		async fuzzyUserCacheQuery(query: string, max: number = 10) {
			const viewers = [...this.nameLookup.values()].filter((v) => v.displayName != null)
			const fuzzySearch = fuzzysort.go(query, viewers, { key: "displayName", limit: max })

			const result = fuzzySearch.map((r) => r.obj)
			return result
		}
	}
)

export function onViewerSeen(func: (viewer: TwitchViewerUnresolved) => any) {
	onLoad(() => {
		ViewerCache.getInstance().onViewerSeen.register(func)
	})

	onUnload(() => {
		ViewerCache.getInstance().onViewerSeen.unregister(func)
	})
}
