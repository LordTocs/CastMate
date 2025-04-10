import _debounce from "lodash/debounce"
import {
	PluginManager,
	ReactiveEffect,
	Service,
	autoRerun,
	defineAction,
	defineRendererCallable,
	defineRendererInvoker,
	defineCallableIPC,
	ensureDirectory,
	ensureYAML,
	loadYAML,
	onLoad,
	runOnChange,
	templateSchema,
	writeYAML,
	StreamPlanManager,
	defineState,
	isProbablyFromTemplate,
	usePluginLogger,
	ReactiveRef,
	useState,
	ignoreReactivity,
} from "castmate-core"
import {
	StreamInfo,
	StreamInfoSchema,
	TwitchCategory,
	TwitchStreamTags,
	TwitchViewer,
} from "castmate-plugin-twitch-shared"
import { TwitchAccount } from "./twitch-auth"
import { HelixChannelUpdate } from "@twurple/api"
import { onChannelAuth } from "./api-harness"
import { CategoryCache } from "./category-cache"
import { ViewerCache } from "./viewer-cache"

const rendererUpdateStreamInfo = defineCallableIPC<(info: StreamInfo) => any>("twitch", "updateStreamInfo")
const logger = usePluginLogger("twitch")

export const StreamInfoManager = Service(
	class {
		private activeInfo: StreamInfo

		private titleRef: ReactiveRef<string>
		private categoryRef: ReactiveRef<TwitchCategory | undefined>

		constructor() {
			this.activeInfo = {
				title: undefined,
				category: undefined,
				tags: [],
			}

			this.titleRef = useState<string>("twitch", "title")
			this.categoryRef = useState<TwitchCategory | undefined>("twitch", "category")
		}

		async initialize() {
			//Load active info
			await ensureYAML({ title: undefined, category: undefined, tags: [] }, "twitch", "info-manager.yaml")
			this.activeInfo = await loadYAML("twitch", "info-manager.yaml")
			rendererUpdateStreamInfo(this.activeInfo)
		}

		async startManagingInfo() {
			await this.createUpdateEffect()
		}

		private updateEffect: ReactiveEffect

		private async updateTwitchInfo() {
			const resolvedInfo = await templateSchema(
				this.activeInfo,
				StreamInfoSchema,
				PluginManager.getInstance().state
			)

			if (!TwitchAccount.channel.isAuthenticated) {
				return
			}

			const update: HelixChannelUpdate = {}

			if (resolvedInfo.title != null) {
				update.title = resolvedInfo.title
			}
			if (resolvedInfo.category != null) {
				update.gameId = resolvedInfo.category
			}

			if (resolvedInfo.tags != null) {
				update.tags = resolvedInfo.tags
			}

			if (update.title == null && update.gameId == null && update.tags == null) return

			await TwitchAccount.channel.apiClient.channels.updateChannelInfo(TwitchAccount.channel.twitchId, update)

			await ignoreReactivity(async () => {
				logger.log("Updating Channel Info", update)

				if (resolvedInfo.title != null) this.titleRef.value = resolvedInfo.title

				if (resolvedInfo.category != null) {
					try {
						this.categoryRef.value = await CategoryCache.getInstance().getCategoryById(
							resolvedInfo.category
						)
					} catch (err) {}
				}
			})
		}
		private debouncedUpdateTwitchInfo = _debounce(() => this.updateTwitchInfo(), 300)

		private async createUpdateEffect() {
			if (this.updateEffect) {
				this.updateEffect.dispose()
			}
			this.updateEffect = await runOnChange(() => this.updateTwitchInfo(), this.debouncedUpdateTwitchInfo)
		}

		async setInfo(newInfo: StreamInfo) {
			this.activeInfo = newInfo
			rendererUpdateStreamInfo(this.activeInfo)
			await this.createUpdateEffect()
			await writeYAML(this.activeInfo, "twitch", "info-manager.yaml")
		}

		async updateInfo(newInfo: Partial<StreamInfo>) {
			Object.assign(this.activeInfo, newInfo)
			rendererUpdateStreamInfo(this.activeInfo)
			await this.createUpdateEffect()
			await writeYAML(this.activeInfo, "twitch", "info-manager.yaml")
		}

		async reconcileTwitchUpdate(title: string, categoryId: string, tags: string[] | undefined) {
			const titleMatches = isProbablyFromTemplate(title, this.activeInfo.title ?? "")

			let tagsMatch = true
			const activeTags = this.activeInfo.tags ?? []
			if (tags != null) {
				tagsMatch = false

				if (tags.length == activeTags.length) {
					tagsMatch = true
					for (let i = 0; i < tags.length; ++i) {
						if (!isProbablyFromTemplate(tags[i], activeTags[i])) {
							tagsMatch = false
							break
						}
					}
				}
			}

			const updateInfo: StreamInfo = {
				title: titleMatches ? this.activeInfo.title : title,
				category: categoryId,
				tags: tags ?? activeTags,
			}
			const needsUpdate = !titleMatches || !tagsMatch || this.activeInfo.category != categoryId

			if (needsUpdate) {
				await this.setInfo(updateInfo)
			}
		}

		get streamInfo() {
			return this.activeInfo
		}
	}
)

export function setupInfoManager() {
	onLoad(async () => {
		StreamInfoManager.initialize()
		await StreamInfoManager.getInstance().initialize()

		StreamPlanManager.getInstance().registerComponentType({
			id: "twitch-stream-info",
			async onActivate(segmentId, config: Partial<StreamInfo>) {
				await StreamInfoManager.getInstance().updateInfo(config)
			},
			async activeConfigChanged(segmentId, config: Partial<StreamInfo>) {
				await StreamInfoManager.getInstance().updateInfo(config)
			},
		})
	})

	defineRendererCallable("setStreamInfo", async (streamInfo: StreamInfo) => {
		await StreamInfoManager.getInstance().setInfo(streamInfo)
	})

	defineRendererCallable("getStreamInfo", async () => {
		return StreamInfoManager.getInstance().streamInfo
	})

	defineAction({
		id: "setStreamInfo",
		name: "Update Stream Info",
		config: {
			type: Object,
			properties: {
				title: { type: String, name: "Title", template: true },
				category: { type: TwitchCategory, name: "Category", template: true },
				tags: { type: TwitchStreamTags, template: true, required: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await StreamInfoManager.getInstance().setInfo(config)
		},
	})

	const category = defineState("category", {
		type: TwitchCategory,
		name: "Category",
	})

	const title = defineState("title", {
		type: String,
		required: true,
		default: "",
	})

	const live = defineState("live", {
		type: Boolean,
		required: true,
		default: false,
	})

	onChannelAuth(async (channel, service) => {
		service.eventsub.onChannelUpdate(channel.twitchId, async (event) => {
			logger.log("Channel Update", event.streamTitle, event.categoryName)

			title.value = event.streamTitle
			category.value = await CategoryCache.getInstance().getCategoryById(event.categoryId)

			await StreamInfoManager.getInstance().reconcileTwitchUpdate(event.streamTitle, event.categoryId, undefined)
		})

		const queryResult = await channel.apiClient.channels.getChannelInfoById(channel.twitchId)
		if (queryResult) {
			title.value = queryResult.title
			category.value = await CategoryCache.getInstance().getCategoryById(queryResult.gameId)

			await StreamInfoManager.getInstance().reconcileTwitchUpdate(
				queryResult.title,
				queryResult.gameId,
				queryResult.tags
			)
		}

		const stream = await channel.apiClient.streams.getStreamByUserId(channel.twitchId)
		live.value = stream != null

		await StreamInfoManager.getInstance().startManagingInfo()

		logger.log("Registering Online Handlers")
		service.eventsub.onStreamOnline(channel.twitchId, async (event) => {
			logger.log("Stream Going Online")
			live.value = true
		})

		service.eventsub.onStreamOffline(channel.twitchId, async (event) => {
			logger.log("Stream Going Offline")
			live.value = false
		})
	})
}
