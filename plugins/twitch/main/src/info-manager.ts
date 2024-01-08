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
} from "castmate-core"
import { StreamInfo, StreamInfoSchema, TwitchCategory } from "castmate-plugin-twitch-shared"
import { TwitchAccount } from "./twitch-auth"
import { HelixChannelUpdate } from "@twurple/api"

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

		get streamInfo() {
			return this.activeInfo
		}
	}
)

export function setupInfoManager() {
	onLoad(async () => {
		StreamInfoManager.initialize()
		await StreamInfoManager.getInstance().initialize()
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
}
