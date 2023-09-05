import { EventSubWsListener } from "@twurple/eventsub-ws"
import { TwitchAccount } from "./twitch-auth"
import { ChatClient } from "@twurple/chat"
import { PubSubClient } from "@twurple/pubsub"
import { Service, onLoad, onUnload } from "castmate-core"
import { EventList } from "castmate-core/src/util/events"

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
			const channelAccount = TwitchAccount.storage.getById("channel")
			if (!channelAccount) throw Error("What?") //Never should happen

			channelAccount.onSecretsChanged.register(() => {
				this.onReauthChannel()
			})
		}

		private onChannelReauthList = new EventList<
			(channelAccount: TwitchAccount, service: InstanceType<typeof TwitchAPIService>) => any
		>()
		registerOnChannelReauth(
			func: (channelAccount: TwitchAccount, service: InstanceType<typeof TwitchAPIService>) => any
		) {
			this.onChannelReauthList.register(func)
		}

		unregisterOnChannelReauth(
			func: (channelAccount: TwitchAccount, service: InstanceType<typeof TwitchAPIService>) => any
		) {
			this.onChannelReauthList.unregister(func)
		}

		async finalize() {
			const channelAccount = TwitchAccount.storage.getById("channel")
			if (!channelAccount) throw Error("What?") //Never should happen

			if (channelAccount.config.name.length > 0) {
				//TODO: use state.authenticated
				this.onReauthChannel()
			}
		}

		private async onReauthChannel() {
			const channelAccount = TwitchAccount.storage.getById("channel")
			if (!channelAccount) throw Error("What?") //Never should happen

			this._chatClient = new ChatClient({
				authProvider: channelAccount,
				channels: [channelAccount.config.name],
			})
			this._pubsubClient = new PubSubClient({
				authProvider: channelAccount,
			})

			this._eventsub = new EventSubWsListener({
				apiClient: channelAccount.apiClient,
			})

			await this._chatClient.connect()

			console.log("Reauthing Channel")

			//@ts-ignore Damned type system
			await this.onChannelReauthList.run(channelAccount, this)
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
