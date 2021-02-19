const AuthManager = require("../utils/twitchAuth");

const { ApiClient, HelixFollow } = require("twitch");

const { ChatClient } = require("twitch-chat-client");

module.exports = {
	name: "twitch",
	async init()
	{
		this.channelAuth = new AuthManager("channel");
		this.channelAuth.setClientInfo(this.secrets.apiClientId, this.secrets.apiClientSecret);

		//Do the channel authentication
		this.channelAuth.installMiddleware(this.webServices.app);

		await this.channelAuth.doAuth();

		let chatAuthProvider = this.channelAuth.createAuthProvider()

		this.channelTwitchClient = new ApiClient({
			authProvider: chatAuthProvider,
		});

		if (this.settings.botName != this.settings.channelName)
		{
			this.botAuth = new AuthManager("bot");
			this.botAuth.setClientInfo(this.secrets.apiClientId, this.secrets.apiClientSecret);
			//Do the bot authentication only if there's a different bot name
			this.botAuth.installMiddleware(this.webServices.app);
			await this.botAuth.doAuth();

			chatAuthProvider = this.botAuth.createAuthProvider()

			this.botTwitchClient = new ApiClient({
				authProvider: chatAuthProvider
			});
		}
		else
		{
			this.botTwitchClient = this.channelTwitchClient;
		}

		//Get the IDs

		this.channelId = await (await this.channelTwitchClient.kraken.users.getMe()).id;
		this.botId = await (await this.botTwitchClient.kraken.users.getMe()).id;

		this.chatClient = new ChatClient(chatAuthProvider, { channels: [this.settings.channelName] });
		await this.chatClient.connect();

		this.chatClient.say(this.settings.channelName.toLowerCase(), "StreamMachine is now running.");

		//Setup triggers
		this.chatClient.onMessage(async (channel, user, message, msgInfo) =>
		{
			let messageLower = message.toLowerCase();

			if (msgInfo.userInfo.isMod || msgInfo.userInfo.isBroadcaster)
			{
				if (this.actions.trigger('modchat', { name: messageLower, user }))
				{
					return;
				}
			}

			if (msgInfo.userInfo.isVip)
			{
				if (this.actions.trigger('vipchat', { name: messageLower, user }))
				{
					return;
				}
			}

			if (msgInfo.userInfo.isSubscriber)
			{
				if (this.actions.trigger('subchat', { name: messageLower, user }))
				{
					return;
				}
			}

			if (this.actions.trigger('chat', { name: messageLower, user }))
			{
				return;
			}

		});
	},
	settings: {
		botName: { type: String },
		channelName: { type: String },
	},
	secrets: {
		apiClientId: { type: String },
		apiClientSecret: { type: String },
	},
	triggers: [
		{ name: "chat" },
		{ name: "subchat" },
		{ name: "vipchat" },
		{ name: "modchat" },
	],
	actions: [
		{
			name: "say",
			handler(message)
			{
				this.chatClient.say(this.settings.channelName.toLowerCase(), message);
			}
		}
	]
}


