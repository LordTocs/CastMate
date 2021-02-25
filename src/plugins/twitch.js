const AuthManager = require("../utils/twitchAuth");

const { ApiClient, HelixFollow } = require("twitch");

const { ChatClient } = require("twitch-chat-client");

const { PubSubClient } = require("twitch-pubsub-client");

const { WebHookListener, ConnectionAdapter } = require("twitch-webhooks");
const { parse } = require("yaml");
const { template } = require ('../utils/template');

class ExpressWebhookAdapter extends ConnectionAdapter
{
	constructor(options, basePath)
	{
		super(options);
		this._hostName = options.hostName;
		this._basePath = basePath;
	}

	/** @protected */
	get connectUsingSsl()
	{
		return this.listenUsingSsl;
	}
	/** @protected */
	async getExternalPort()
	{
		return this.getListenerPort();
	}

	/** @protected */
	async getHostName()
	{
		return this._hostName;
	}

	get pathPrefix()
	{
		return this._basePath;
	}
}

module.exports = {
	name: "twitch",
	async init()
	{
		await this.doAuth();

		await this.setupChatTriggers();

		await this.setupWebHookTriggers();

		await this.setupPubSubTriggers();

		await this.initConditions();
	},
	methods: {
		async doAuth()
		{
			this.channelAuth = new AuthManager("channel");
			this.channelAuth.setClientInfo(this.secrets.apiClientId, this.secrets.apiClientSecret);

			//Do the channel authentication
			this.channelAuth.installMiddleware(this.webServices.app);

			await this.channelAuth.doAuth();

			this.chatAuthProvider = this.channelAuth.createAuthProvider()

			this.channelTwitchClient = new ApiClient({
				authProvider: this.chatAuthProvider,
			});

			if (this.settings.botName != this.settings.channelName)
			{
				this.botAuth = new AuthManager("bot");
				this.botAuth.setClientInfo(this.secrets.apiClientId, this.secrets.apiClientSecret);
				//Do the bot authentication only if there's a different bot name
				this.botAuth.installMiddleware(this.webServices.app);
				await this.botAuth.doAuth();

				this.chatAuthProvider = this.botAuth.createAuthProvider()

				this.botTwitchClient = new ApiClient({
					authProvider: this.chatAuthProvider
				});
			}
			else
			{
				this.botTwitchClient = this.channelTwitchClient;
			}

			//Get the IDs
			this.channelId = await (await this.channelTwitchClient.kraken.users.getMe()).id;
			this.botId = await (await this.botTwitchClient.kraken.users.getMe()).id;
		},

		parseMessage(message)
		{
			let firstSpace = message.indexOf(' ');

			if (firstSpace == -1)
			{
				return { command: message.toLowerCase(), args: [], string: "" }
			}

			let command = message.substr(0, firstSpace).toLowerCase();

			let string = message.substr(firstSpace + 1);

			let args = string.split(' ').filter((arg) => arg.length != 0);

			return { command, args, string };
		},

		async setupChatTriggers()
		{
			this.chatClient = new ChatClient(this.chatAuthProvider, { channels: [this.settings.channelName] });
			await this.chatClient.connect();

			this.chatClient.say(this.settings.channelName.toLowerCase(), "StreamMachine is now running.");

			//Setup triggers
			this.chatClient.onMessage(async (channel, user, message, msgInfo) =>
			{
				let parsed = this.parseMessage(message);

				if (msgInfo.userInfo.isMod || msgInfo.userInfo.isBroadcaster)
				{
					if (this.actions.trigger('modchat', { name: parsed.command, user, args: parsed.args, string: parsed.string }))
					{
						return;
					}
				}

				if (msgInfo.userInfo.isVip)
				{
					if (this.actions.trigger('vipchat', { name: parsed.command, user, args: parsed.args, string: parsed.string }))
					{
						return;
					}
				}

				if (msgInfo.userInfo.isSubscriber)
				{
					if (this.actions.trigger('subchat', { name: parsed.command, user, args: parsed.args, string: parsed.string }))
					{
						return;
					}
				}

				if (this.actions.trigger('chat', { name: parsed.command, user, args: parsed.args, string: parsed.string }))
				{
					return;
				}

			});
		},

		async setupWebHookTriggers()
		{
			this.webhooks = new WebHookListener(this.channelTwitchClient, new ExpressWebhookAdapter({
				hostName: this.webServices.hostname,
				listenerPort: this.webServices.port
			}, "/twitch-hooks"));

			this.webhooks.applyMiddleware(this.webServices.app);

			this.followerCache = new Set();

			await this.webhooks.subscribeToFollowsToUser(this.channelId, async (follow) =>
			{
				if (this.followerCache.has(follow.userId))
					return;

				this.followerCache.add(follow.userId);

				console.log(`followed by ${follow?.userDisplayName}`);
				this.actions.trigger('follow', { user: follow?.userDisplayName });

				//let follows = await channelTwitchClient.helix.users.getFollows({ followedUser: channelId });
				//variables.set("followers", follows.total);
			});

			await this.webhooks.subscribeToStreamChanges(this.channelId, async (stream) =>
			{
				//Stream Changed
				console.log("Stream Changed");

				let game = await stream.getGame();
				console.log("Game Name", game.name);

				this.state.twitchCategory = game.name;
			});
		},

		async setupPubSubTriggers()
		{
			this.pubSubClient = new PubSubClient();
			await this.pubSubClient.registerUserListener(this.channelTwitchClient, this.channelId);

			await this.pubSubClient.onBits(this.channelId, (message) =>
			{
				console.log(`Bits: ${message.bits}`);
				this.actions.trigger("bits", { number: message.bits, user: message.userName });
			});

			await this.pubSubClient.onRedemption(this.channelId, (message) =>
			{
				console.log(`Redemption: ${message.rewardId} ${message.rewardName}`);
				this.actions.trigger("redemption", { name: message.rewardName, msg: message.message, user: message.userDisplayName });
			});

			await this.pubSubClient.onSubscription(this.channelId, async (message) =>
			{
				if (message.isGift)
				{
					console.log(`Gifted sub ${message.gifterDisplayName} -> ${message.userDisplayName}`);
					this.actions.trigger('subscribe', { name: "gift", gifter: message.gifterDisplayName, user: message.userDisplayName });
				}
				else
				{
					let months = message.months ? message.months : 0;
					console.log(`Sub ${message.userDisplayName} : ${months}`);
					this.actions.trigger('subscribe', { number: months, user: message.userDisplayName, prime: message.subPlan == "Prime" })
				}

				//variables.set('subscribers', await channelTwitchClient.kraken.channels.getChannelSubscriptionCount(channelId))
			});
		},

		async initConditions()
		{
			let stream = await this.channelTwitchClient.helix.streams.getStreamByUserId(this.channelId);

			if (stream)
			{
				let game = await stream.getGame();

				this.state.twitchCategory = game.name;
			}
		}
	},
	settings: {
		botName: { type: String },
		channelName: { type: String },
	},
	secrets: {
		apiClientId: { type: String },
		apiClientSecret: { type: String },
	},
	state:{
		twitchCategory: {
			type: String,
			name: "Twitch Category",
			description: "Change profiles based on the stream's twitch category"
		}
	},
	triggers: {
		chat: {
			name: "Chat",
			description: "Fires when any user chats."
		},
		subchat: {
			name: "Sub Chat",
			description: "Fires for only subscribed user chats"
		},
		vipchat: {
			name: "VIP Chat",
			description: "Fires for only VIP user chats"
		},
		modchat: {
			name: "Mod Chat",
			description: "Fires for when a mod or the broadcaster chats"
		},
		redemption: {
			name: "Channel Points Redemption",
			description: "Fires for when a channel point reward is redeemed"
		},
		follow: {
			name: "Follow",
			description: "Fires for when a user follows."
		},
		subscribe: {
			name: "Subscription",
			description: "Fires for when a user subscribes."
		},
		bits: {
			name: "Bits",
			description: "Fires for when a user gives bits"
		}
	},
	actions: {
		say: {
			name: "Say",
			description: "Uses the bot to send a twitch chat message",
			handler(message, context)
			{
				this.chatClient.say(this.settings.channelName.toLowerCase(), template(message, context));
			}
		}
	}
}


