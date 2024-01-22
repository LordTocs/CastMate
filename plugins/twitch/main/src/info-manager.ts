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
	StreamPlanComponents,
	defineState,
	isProbablyFromTemplate,
} from "castmate-core"
import { StreamInfo, StreamInfoSchema, TwitchCategory, TwitchViewer } from "castmate-plugin-twitch-shared"
import { TwitchAccount } from "./twitch-auth"
import { HelixChannelUpdate } from "@twurple/api"
import { onChannelAuth } from "./api-harness"
import { CategoryCache } from "./category-cache"
import { ExposedSchemaPropType, ExposedSchemaType, ExposedSchemaTypeUnion, declareSchema } from "castmate-schema"

const rendererUpdateStreamInfo = defineCallableIPC<(info: StreamInfo) => any>("twitch", "updateStreamInfo")

export const StreamInfoManager = Service(
	class {
		private activeInfo: StreamInfo

		constructor() {
			this.activeInfo = {
				title: undefined,
				category: undefined,
			}
		}

		async initialize() {
			//Load active info
			await ensureYAML({ title: undefined, category: undefined }, "twitch", "info-manager.yaml")
			this.activeInfo = await loadYAML("twitch", "info-manager.yaml")
			rendererUpdateStreamInfo(this.activeInfo)
			await this.createUpdateEffect()

			TwitchAccount.channel.onAuthorized.register(() => {
				this.createUpdateEffect()
			})
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

			if (update.title == null && update.gameId == null) return

			await TwitchAccount.channel.apiClient.channels.updateChannelInfo(TwitchAccount.channel.twitchId, update)
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

		async reconcileTwitchUpdate(title: string, categoryId: string) {
			const titleMatches = isProbablyFromTemplate(title, this.activeInfo.title ?? "")

			const updateInfo: StreamInfo = {
				title: titleMatches ? this.activeInfo.title : title,
				category: categoryId,
			}
			const needsUpdate = !titleMatches || this.activeInfo.category != categoryId

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

		StreamPlanComponents.getInstance().registerComponentType({
			id: "twitch-stream-info",
			onActivate(segmentId, config: StreamInfo) {
				StreamInfoManager.getInstance().setInfo(config)
			},
			activeConfigChanged(segmentId, config: StreamInfo) {
				StreamInfoManager.getInstance().setInfo(config)
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
				category: { type: TwitchCategory, name: "Category" },
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

	onChannelAuth(async (channel, service) => {
		service.eventsub.onChannelUpdate(channel.twitchId, async (event) => {
			console.log("Channel Update", event.streamTitle, event.categoryName)

			title.value = event.streamTitle

			const updateCategory = await CategoryCache.getInstance().getCategoryById(event.categoryId)

			category.value = updateCategory

			await StreamInfoManager.getInstance().reconcileTwitchUpdate(event.streamTitle, event.categoryId)
		})

		const queryResult = await channel.apiClient.channels.getChannelInfoById(channel.twitchId)
		if (queryResult) {
			title.value = queryResult.title
			category.value = await CategoryCache.getInstance().getCategoryById(queryResult.gameId)

			await StreamInfoManager.getInstance().reconcileTwitchUpdate(queryResult.title, queryResult.gameId)
		}
	})
}
