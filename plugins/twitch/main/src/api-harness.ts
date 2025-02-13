import { EventSubWsListener } from "@twurple/eventsub-ws"
import { TwitchAccount } from "./twitch-auth"
import { ChatClient } from "@twurple/chat"
import { Service, isCastMate, onLoad, onUnload, usePluginLogger } from "castmate-core"
import { EventList } from "castmate-core/src/util/events"

const logger = usePluginLogger("twitch")

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

export const TwitchAPIService = Service(
	class {
		private _chatClient: ChatClient
		get chatClient() {
			return this._chatClient
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

			TwitchAccount.bot.onAuthorized.register(() => {
				this.onReauthBot()
			})
		}

		private finalized = false
		private onChannelReauthList = new EventList<
			(channelAccount: TwitchAccount, service: InstanceType<typeof TwitchAPIService>) => any
		>()
		private onBotReauthList = new EventList<
			(botAccount: TwitchAccount, service: InstanceType<typeof TwitchAPIService>) => any
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

		registerOnBotReauth(
			func: (channelAccount: TwitchAccount, service: InstanceType<typeof TwitchAPIService>) => any
		) {
			if (TwitchAccount.channel.isAuthenticated && this.finalized) {
				func(TwitchAccount.channel, this)
			}

			this.onBotReauthList.register(func)
		}

		unregisterOnBotReauth(
			func: (channelAccount: TwitchAccount, service: InstanceType<typeof TwitchAPIService>) => any
		) {
			this.onBotReauthList.unregister(func)
		}

		async finalize() {
			this.finalized = true
			if (TwitchAccount.channel.isAuthenticated) {
				await this.onReauthChannel()
			}
		}

		private async onReauthBot() {
			if (!TwitchAccount.channel.isAuthenticated) return
			if (!TwitchAccount.bot.isAuthenticated) return

			logger.log("Reauthing Bot")
			this._chatClient?.quit()

			this._chatClient = new ChatClient({
				authProvider: TwitchAccount.bot,
				channels: [TwitchAccount.channel.config.name],
				logger: twurpleLog,
			})

			await this._chatClient.connect()

			await this.onBotReauthList.run(TwitchAccount.bot, this)
		}

		private async onReauthChannel() {
			const channelAccount = TwitchAccount.channel

			logger.log("Reauthing Channel")

			if (isCastMate()) {
				this._eventsub?.stop()

				this._eventsub = new EventSubWsListener({
					apiClient: channelAccount.apiClient,
					logger: twurpleLog,
				})
			}

			//@ts-ignore Damned type system
			await this.onChannelReauthList.run(channelAccount, this)

			if (isCastMate()) {
				this.eventsub.onSubscriptionCreateFailure((sub, error) => {
					logger.error("ERROR WITH EVENTSUB", sub.id)
					logger.error(error)
				})

				this.eventsub.onSubscriptionCreateSuccess((event, sub) => {
					logger.log("Listening to eventsub", event.id, sub.id)
				})

				this.eventsub.onSubscriptionDeleteFailure((sub, error) => {
					logger.error("ERROR DELETING EVENTSUB", sub.id)
					logger.error(error)
				})

				this.eventsub.start()
			}

			//Restart the bot stuffs since we've changed main channel.
			await this.onReauthBot()
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

export function onBotAuth(func: (channel: TwitchAccount, service: InstanceType<typeof TwitchAPIService>) => any) {
	onLoad(() => {
		TwitchAPIService.getInstance().registerOnBotReauth(func)
	})

	onUnload(() => {
		TwitchAPIService.getInstance().unregisterOnBotReauth(func)
	})
}
