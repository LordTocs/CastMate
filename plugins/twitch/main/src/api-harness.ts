import { EventSubWsListener } from "@twurple/eventsub-ws"
import { TwitchAccount } from "./twitch-auth"
import { ChatClient } from "@twurple/chat"
import { PubSubClient } from "@twurple/pubsub"
import { Service, onLoad, onUnload, usePluginLogger } from "castmate-core"
import { EventList } from "castmate-core/src/util/events"

const logger = usePluginLogger("twitch")

export const TwitchAPIService = Service(
	class {
		private _chatClient: ChatClient
		get chatClient() {
			return this._chatClient
		}

		private _pubsubClient: PubSubClient
		get pubsubClient() {
			return this._pubsubClient
		}

		private _eventsub: EventSubWsListener
		get eventsub() {
			return this._eventsub
		}

		constructor() {
			const channelAccount = TwitchAccount.channel
			channelAccount.onAuthorized.register(() => {
				this.onReauthChannel()
			})
		}

		private finalized = false
		private onChannelReauthList = new EventList<
			(channelAccount: TwitchAccount, service: InstanceType<typeof TwitchAPIService>) => any
		>()
		registerOnChannelReauth(
			func: (channelAccount: TwitchAccount, service: InstanceType<typeof TwitchAPIService>) => any
		) {
			if (TwitchAccount.channel.isAuthenticated && this.finalized) {
				func(TwitchAccount.channel, this)
			}

			this.onChannelReauthList.register(func)
		}

		unregisterOnChannelReauth(
			func: (channelAccount: TwitchAccount, service: InstanceType<typeof TwitchAPIService>) => any
		) {
			this.onChannelReauthList.unregister(func)
		}

		async finalize() {
			this.finalized = true
			if (TwitchAccount.channel.config.name.length > 0) {
				await this.onReauthChannel()
			}
		}

		private async onReauthChannel() {
			const channelAccount = TwitchAccount.channel

			const twurpleLog = {
				custom(level: number, message: string) {
					if (level > 2) return
					let levelName = ""
					if (level == 2) levelName = "warning"
					if (level == 1) levelName = "error"
					if (level == 0) levelName = "critical"
					logger.error("Twurple", levelName, ":", message)
				},
			}

			this._chatClient = new ChatClient({
				authProvider: channelAccount,
				channels: [channelAccount.config.name],
				logger: twurpleLog,
			})
			this._pubsubClient = new PubSubClient({
				authProvider: channelAccount,
				logger: twurpleLog,
			})

			this._eventsub = new EventSubWsListener({
				apiClient: channelAccount.apiClient,
				logger: twurpleLog,
			})

			await this._chatClient.connect()

			logger.log("Reauthing Channel")

			//@ts-ignore Damned type system
			await this.onChannelReauthList.run(channelAccount, this)

			this.eventsub.start()
		}
	}
)

export function onChannelAuth(func: (channel: TwitchAccount, service: InstanceType<typeof TwitchAPIService>) => any) {
	onLoad(() => {
		TwitchAPIService.getInstance().registerOnChannelReauth(func)
	})

	onUnload(() => {
		TwitchAPIService.getInstance().unregisterOnChannelReauth(func)
	})
}
