const { ElectronAuthManager } = require("../utils/twitchAuth");

const { ApiClient } = require("@twurple/api");

const { ChatClient } = require("@twurple/chat");

const { PubSubClient, BasicPubSubClient } = require("@twurple/pubsub");

const { template } = require('../utils/template');
const { evalTemplate } = require('../utils/template');
const HotReloader = require("../utils/hot-reloader");

const BadWords = require("bad-words");

const { rewardsFilePath } = require("../utils/configuration");

const { WebSocket } = require('ws');

const axios = require('axios');
const logger = require("../utils/logger");
const { inRange } = require("../utils/range");


//https://stackoverflow.com/questions/1968167/difference-between-dates-in-javascript/27717994
function dateInterval(date1, date2) {
	if (date1 > date2) { // swap
		var result = dateInterval(date2, date1);
		result.years = -result.years;
		result.months = -result.months;
		result.days = -result.days;
		result.hours = -result.hours;
		return result;
	}
	result = {
		years: date2.getYear() - date1.getYear(),
		months: date2.getMonth() - date1.getMonth(),
		days: date2.getDate() - date1.getDate(),
		hours: date2.getHours() - date1.getHours()
	};
	if (result.hours < 0) {
		result.days--;
		result.hours += 24;
	}
	if (result.days < 0) {
		result.months--;
		// days = days left in date1's month, 
		//   plus days that have passed in date2's month
		var copy1 = new Date(date1.getTime());
		copy1.setDate(32);
		result.days = 32 - date1.getDate() - copy1.getDate() + date2.getDate();
	}
	if (result.months < 0) {
		result.years--;
		result.months += 12;
	}
	return result;
}

module.exports = {
	name: "twitch",
	uiName: "Twitch",
	icon: "mdi-twitch",
	color: "#5E5172",
	async init() {
		this.logger.info("Starting Twitch");

		await this.doInitialAuth();

		this.colorCache = {};

		this.state.viewers = 0;

		this.filter = new BadWords();//{ emptyList: true }); //Temporarily Disable the custom bad words list.
		//this.filter.addWords(...badwordList.words);
	},
	methods: {
		filterMessage(message) {
			if (!message || message.length < 2)
				return message;

			if (!this.filter)
				return "";

			try {
				return this.filter.clean(message)
			}
			catch (err) {
				return ""
			}
		},

		async doInitialAuth() {
			let clientId = this.secrets.apiClientId || "qnybd4aoxlom3u3wjbsstsp5yd2sdl"

			this.channelAuth = new ElectronAuthManager({ clientId, redirectUri: `http://localhost/auth/channel/redirect`, name: "Channel" })
			this.botAuth = new ElectronAuthManager({ clientId, redirectUri: `http://localhost/auth/channel/redirect`, name: "Bot", scopes: ["chat:edit", "chat:read"] })

			await Promise.all([this.channelAuth.trySilentAuth(), await this.botAuth.trySilentAuth()]);

			await this.completeAuth();

			await this.getAllTags();

		},

		async shutdown() {
			this.state.botName = null;
			this.state.channelName = null;

			if (this.chatClient) {
				await this.chatClient.quit();
			}

			if (this.basePubSubClient) {
				this.basePubSubClient.disconnect();
			}

			if (this.castMateWebsocket) {
				//Flag so the automatic reconnect does not run
				this.castMateWebsocketReconnect = false;
				this.castMateWebsocket.terminate();
				clearInterval(this.castMateWebsocketPinger);
				this.castMateWebsocketPinger = null;
				this.castMateWebsocket = null;
			}
		},

		async completeAuth() {
			await this.shutdown();

			try {
				await this.createApiClients();
			}
			catch (err) {
				this.logger.error(`Failed to create api clients`);
				this.logger.error(`${err}`);
			}

			if (!this.channelAuth || !this.channelAuth.isAuthed) {
				this.logger.info("Failed to complete auth.");
				this.logger.info("  Channel Is Not Authed.");
				this.state.isAuthed = false;
				return;
			}

			if (!this.botAuth || !this.botAuth.isAuthed) {
				this.logger.info("No bot account authed.");
			}

			this.state.isAuthed = true;

			//Set some analytics
			this.analytics.setUserId(this.channelId);
			this.analytics.set({
				$first_name: this.state.channelName,
			});
			this.analytics.track("twitchAuth");

			if (this.botId) {
				this.analytics.set({ botId: this.botId, $last_name: this.state.botName });
			}

			try {
				await this.setupChatTriggers();
			}
			catch (err) {
				this.logger.error(`Failed to setup Chat Triggers`);
				this.logger.error(`${err}`);
			}

			try {
				await this.setupCastMateWebsocketWorkaround();
			}
			catch (err) {
				this.logger.error(`Failed to setup Websocket Workaround`);
				this.logger.error(`${err}`);
			}

			try {
				await this.setupPubSubTriggers();
			}
			catch (err) {
				this.logger.error(`Failed to set up PubSub Triggers`);
				this.logger.error(`${err}`);
			}

			await this.initConditions();

			try {
				await this.initChannelRewards();
			}
			catch (err) {
				this.logger.error(`Failed to setup Channel Rewards`);
				this.logger.error(`${err}`);
			}
		},

		async createApiClients() {
			this.chatAuthProvider = null;

			if (this.channelAuth && this.channelAuth.isAuthed) {

				this.channelTwitchClient = new ApiClient({
					authProvider: this.channelAuth,
				});

				let channel = await this.channelTwitchClient.users.getMe(false);
				this.state.channelName = channel.displayName;
				this.state.channelProfileUrl = channel.profilePictureUrl;
				this.channelId = await channel.id;


				this.state.isAffiliate = channel.broadcasterType.length > 0;

				this.chatAuthProvider = this.channelAuth;
				this.logger.info(`Channel Signed in As ${channel.displayName}`);
			}
			else {
				this.state.channelName = null;
				this.state.channelProfileUrl = null;

				this.state.isAffiliate = false;

				this.channelId = null;

				this.logger.info(`Channel Not Signed In`);
			}

			if (this.botAuth && this.botAuth.isAuthed) {
				this.botTwitchClient = new ApiClient({
					authProvider: this.botAuth,
				});

				let bot = await this.botTwitchClient.users.getMe(false);

				this.state.botName = bot.displayName;
				this.state.botProfileUrl = bot.profilePictureUrl;
				this.chatAuthProvider = this.botAuth;
				this.botId = await bot.id;
				this.logger.info(`Bot Signed in As ${bot.displayName}`);
			}
			else {
				this.state.botName = null;
				this.state.botProfileUrl = null;
				this.botId = null;
				this.logger.info(`Bot Not Signed In`);
			}
		},

		parseMessage(message) {
			let firstSpace = message.indexOf(' ');

			if (firstSpace == -1) {
				return { command: message.toLowerCase(), args: [], string: "" }
			}

			let command = message.substr(0, firstSpace).toLowerCase();

			let string = message.substr(firstSpace + 1);

			let args = string.split(' ').filter((arg) => arg.length != 0);

			return { command, args, string };
		},

		async setupChatTriggers() {
			this.chatClient = new ChatClient({ authProvider: this.chatAuthProvider, channels: [this.state.channelName, ...(this.settings.auxiliaryChannel ? [this.settings.auxiliaryChannel] : [])] });
			await this.chatClient.connect();

			this.logger.info(`Connected to Chat`);

			//Setup triggers
			this.chatClient.onMessage(async (channel, user, message, msgInfo) => {
				if (this.colorCache)
					this.colorCache[msgInfo.userInfo.userId] = msgInfo.userInfo.color;

				this.webServices.websocketServer.broadcast(JSON.stringify({
					chat: {
						user,
						color: msgInfo.userInfo.color,
						message,
						emoteOffsets: Object.fromEntries(msgInfo.emoteOffsets)
					}
				}));

				let parsed = this.parseMessage(message);

				const context = {
					command: parsed.command,
					user,
					userId: msgInfo.userInfo.userId,
					args: parsed.args,
					argString: parsed.string,
					userColor: msgInfo.userInfo.color,
					message,
					filteredMessage: this.filterMessage(message)
				}

				if (msgInfo.tags.get('first-msg') !== '0') {
					this.triggers.firstTimeChat(context);
				}

				this.triggers.chat(context, msgInfo.userInfo);
			});

			this.chatClient.onRaid((channel, user, raidInfo, msgInfo) => {
				this.triggers.raid({
					number: raidInfo.viewerCount,
					user: raidInfo.displayName,
					userId: msgInfo.userInfo.userId
				});
			})

			//See here https://twurple.js.org/docs/examples/chat/sub-gift-spam.html
			const giftCounts = new Map();

			this.chatClient.onCommunitySub((channel, user, subInfo) => {
				const previousGiftCount = giftCounts.get(user) || 0;
				giftCounts.set(user, previousGiftCount + subInfo.count);
				this.triggers.giftedSub({ number: subInfo.count, user: subInfo.gifterDisplayName, userId: subInfo.gifterUserId, userColor: this.colorCache[subInfo.gifterUserId] })
			});

			this.chatClient.onSubGift((channel, recipient, subInfo) => {
				const user = subInfo.gifter;
				const previousGiftCount = giftCounts.get(user) || 0;
				if (previousGiftCount > 0) {
					giftCounts.set(user, previousGiftCount - 1);
				}
				else {
					this.triggers.giftedSub({ number: 1, user: subInfo.gifterDisplayName, userId: subInfo.gifterUserId, userColor: this.colorCache[subInfo.gifterUserId] })
				}
			});

		},

		async retryWebsocketWorkaround() {
			if (this.castMateWebsocket) {
				this.castMateWebsocket.terminate();

				if (this.castMateWebsocketPinger) {
					clearInterval(this.castMateWebsocketPinger);
					this.castMateWebsocketPinger = null;
				}
			}

			this.castMateWebsocket = null;

			//Retry connection in 5 seconds.
			if (this.castMateWebsocketReconnect) {
				this.logger.info(`Connection to castmate websocket failed, retrying in 5 seconds...`);
				setTimeout(() => {
					this.setupCastMateWebsocketWorkaround().catch(err => {
						this.logger.error(`Exception on socket reconnect.`);
						this.logger.error(`${err}`);
						this.retryWebsocketWorkaround();
					})
				}, 5000);
			}
		},

		async setupCastMateWebsocketWorkaround() {
			this.followerCache = new Set();

			this.castMateWebsocketReconnect = true;

			this.castMateWebsocket = new WebSocket('wss://castmate-websocket.herokuapp.com', {
				headers: {
					Authorization: `Bearer ${this.channelAuth._accessToken.accessToken}`,
				}
			});

			this.castMateWebsocket.on('open', () => {
				this.logger.info(`Connection to castmate websocket open`);

				this.castMateWebsocketPinger = setInterval(() => {
					this.castMateWebsocket.ping()
				}, 30000);
			})

			this.castMateWebsocket.on('message', async (data) => {
				let message = null;
				try {
					message = JSON.parse(data);
				}
				catch
				{
					console.error("Unable to parse", data);
				}

				if (!message)
					return;

				if (message.event == "follow") {
					if (this.followerCache.has(message.userId))
						return;

					this.followerCache.add(message.userId);

					this.logger.info(`followed by ${message.userDisplayName}`);
					this.triggers.follow({ user: message.userDisplayName, userId: message.userId, ...{ userColor: this.colorCache[message.userId] } });

					let follows = await this.channelTwitchClient.users.getFollows({ followedUser: this.channelId });
					this.state.followers = follows.total;
				}
			});

			this.castMateWebsocket.on('close', () => {

				this.retryWebsocketWorkaround();
			});

			this.castMateWebsocket.on('unexpected-response', (request, response) => {
				this.logger.error(`Unexpected Response!`);
				console.log(response);
				this.retryWebsocketWorkaround();
				if (response.status == 200) {
					this.logger.info(`It's the mysterious 200 response!`);

				}
			})


		},

		async setupPubSubTriggers() {
			this.basePubSubClient = new BasicPubSubClient();
			this.pubSubClient = new PubSubClient(this.basePubSubClient);
			await this.pubSubClient.registerUserListener(this.channelAuth, this.channelId);

			await this.pubSubClient.onBits(this.channelId, (message) => {
				this.logger.info(`Bits: ${message.bits}`);


				this.triggers.bits({
					number: message.bits,
					user: message.userName,
					userId: message.userId,
					message: message.message,
					filteredMessage: this.filterMessage(message.message),
					...{ userColor: this.colorCache[message.userId] }
				});
			});

			await this.pubSubClient.onRedemption(this.channelId, (redemption) => {
				this.logger.info(`Redemption: ${redemption.rewardId} ${redemption.rewardTitle}`);
				let message = redemption.message;
				if (!message) {
					message = "";
				}

				this.triggers.redemption({
					reward: redemption.rewardTitle,
					message,
					filteredMessage: this.filterMessage(message),
					user: redemption.userDisplayName,
					userId: redemption.userId,
					//...{ userColor: this.colorCache[redemption.userId] }
				});
			});

			await this.pubSubClient.onSubscription(this.channelId, async (message) => {
				if (message.isGift) {
					return; //Handle gifted subs elsewhere
				}
				else {
					let months = message.months ? message.months : 0;
					this.logger.info(`Sub ${message.userDisplayName} : ${months}`);
					this.triggers.subscribe({ number: months, user: message.userDisplayName, userId: message.userId, prime: message.subPlan == "Prime", ...{ userColor: this.colorCache[message.userId] } })
				}

				await this.querySubscribers();
			});

			await this.pubSubClient.onCustomTopic(this.channelId, "video-playback-by-id", async (msg) => {
				this.state.viewers = ("viewers" in msg.data ? msg.data.viewers : 0);
				//console.log("video playback", msg.data);
			});
		},

		async querySubscribers() {
			try {
				const subscribers = await this.channelTwitchClient.subscriptions.getSubscriptions(this.channelId);
				this.state.subscribers = subscribers.total;
			}
			catch
			{
				this.state.subscribers = 0;
			}
		},

		async queryFollows() {
			let follows = await this.channelTwitchClient.users.getFollows({ followedUser: this.channelId });
			this.state.followers = follows.total;
		},

		async initConditions() {

			await this.querySubscribers();
			await this.queryFollows();
		},

		async initChannelRewards() {
			this.rewardsDefinitions = new HotReloader(rewardsFilePath,
				() => {
					this.ensureChannelRewards()
				},
				() => { })
			await this.ensureChannelRewards();
		},

		async ensureChannelRewards() {
			if (!this.state.isAffiliate) {
				this.logger.info("Channel isn't affiliate, skipping channel rewards");
				return;
			}

			let rewards = await this.channelTwitchClient.channelPoints.getCustomRewards(this.channelId, true);

			let handledRewards = new Set();

			for (let reward of rewards) {
				if (!(reward.title in this.rewardsDefinitions.data)) {
					//Not in the file, delete it.
					await this.channelTwitchClient.channelPoints.deleteCustomReward(this.channelId, reward.id);
				}
				else {
					//Existing Reward
					handledRewards.add(reward.title)

					let needsUpdate = false;

					let rewardDef = this.rewardsDefinitions.data[reward.title];

					if (reward.prompt != rewardDef.description)
						needsUpdate = true;
					if (reward.cost != rewardDef.cost)
						needsUpdate = true;

					if (reward.userInputRequired != !!rewardDef.inputRequired)
						needsUpdate = true;
					if (reward.autoApproved != !!rewardDef.skipQueue)
						needsUpdate = true;
					if (reward.globalCooldown != rewardDef.cooldown)
						needsUpdate = true;
					if (reward.maxRedemptionsPerStream != rewardDef.maxRedemptionsPerStream)
						needsUpdate = true;
					if (reward.maxRedemptionsPerUserPerStream != rewardDef.maxRedemptionsPerUserPerStream)
						needsUpdate = true;

					if (needsUpdate) {
						await this.channelTwitchClient.channelPoints.updateCustomReward(this.channelId, reward.id, {
							prompt: rewardDef.description,
							cost: rewardDef.cost,
							userInputRequired: !!rewardDef.inputRequired,
							autoFulfill: !!rewardDef.skipQueue,
							globalCooldown: rewardDef.cooldown || 0,
							maxRedemptionsPerStream: rewardDef.maxRedemptionsPerStream || null,
							maxRedemptionsPerUserPerStream: rewardDef.maxRedemptionsPerUserPerStream || null,
						})
					}
				}
			}

			//Check for new rewards
			for (let rewardKey in this.rewardsDefinitions.data) {
				if (handledRewards.has(rewardKey))
					continue;

				let rewardDef = this.rewardsDefinitions.data[rewardKey];


				//inputRequired: false
				//skipQueue: true
				//Create the new reward.
				try {
					await this.channelTwitchClient.channelPoints.createCustomReward(this.channelId, {
						title: rewardKey,
						prompt: rewardDef.description,
						cost: rewardDef.cost,
						userInputRequired: !!rewardDef.inputRequired,
						autoFulfill: !!rewardDef.skipQueue,
						globalCooldown: rewardDef.cooldown || 0,
						maxRedemptionsPerStream: rewardDef.maxRedemptionsPerStream || null,
						maxRedemptionsPerUserPerStream: rewardDef.maxRedemptionsPerUserPerStream || null,
					})
				} catch (err) {
					this.logger.error(`Error creating channel reward: ${rewardKey}. Message: ${err}`);
				}
			}
		},

		async switchChannelRewards(activeRewards, inactiveRewards) {
			if (!this.channelId || !this.state.isAffiliate)
				return;

			let rewards = await this.channelTwitchClient.channelPoints.getCustomRewards(this.channelId, true);

			for (let reward of rewards) {
				if (!reward.isEnabled && activeRewards.has(reward.title)) {
					await this.channelTwitchClient.channelPoints.updateCustomReward(this.channelId, reward.id, { isPaused: false, isEnabled: true });
				}
				else if (reward.isEnabled && inactiveRewards.has(reward.title)) {
					await this.channelTwitchClient.channelPoints.updateCustomReward(this.channelId, reward.id, { isPaused: false, isEnabled: false });
				}
			}
		}
	},
	ipcMethods: {
		async getAuthStatus() {
			return {
				bot: this.botAuth ? this.state.botName : null,
				channel: this.channelAuth ? this.state.channelName : false,
			}
		},

		async doBotAuth() {
			let result = await this.botAuth.doAuth(true);
			if (result) {
				await this.completeAuth();
				return true;
			}
			return false;
		},

		async doChannelAuth() {
			let result = await this.channelAuth.doAuth(true);
			if (result) {
				await this.completeAuth();
				return true;
			}
			return false;
		},

		async searchCategories(query = "") {
			try {
				const categories = await this.channelTwitchClient.search.searchCategories(query);
				const pojoCategories = [];

				for (let cat of categories.data) {
					pojoCategories.push({
						id: cat.id,
						name: cat.name,
						boxArtUrl: cat.boxArtUrl
					})
				}

				return pojoCategories;
			}
			catch (err) {
				console.error(err);
			}
		},

		async getCategoryById(id) {
			if (!this.channelTwitchClient)
				return null;
			const category = await this.channelTwitchClient.games.getGameById(id);
			if (category) {
				return { name: category.name, id: category.id, boxArtUrl: category.boxArtUrl };
			}
			return null;
		},

		async getAllTags() {
			if (this.tagCache)
				return this.tagCache;

			if (!this.channelAuth || !this.channelAuth.isAuthed || !this.channelTwitchClient)
				return [];

			const pageniator = this.channelTwitchClient.tags.getAllStreamTagsPaginated();

			const tags = await pageniator.getAll();
			const pojoTags = []

			for (let tag of tags) {
				if (!tag.isAuto) {
					pojoTags.push({ id: tag.id, name: tag.getName("en-us") })
				}
			}

			this.tagCache = pojoTags;

			return this.tagCache;
		},

		async updateStreamInfo(info) {
			console.log(this.channelId);

			await this.channelTwitchClient.channels.updateChannelInfo(this.channelId, {
				title: info.title,
				gameId: info.category,
			})

			//Awaiting fix from d-fisher
			//await this.channelTwitchClient.streams.replaceStreamTags(this.channelId, info.tags);

			await axios.put(`https://api.twitch.tv/helix/streams/tags?broadcaster_id=${this.channelId}`, {
				tag_ids: info.tags
			}, {
				headers: {
					Authorization: `Bearer ${this.channelAuth._accessToken.accessToken}`,
					'Client-ID': this.channelAuth.clientId
				}
			})
		}
	},
	async onProfileLoad(profile, config) {
		const redemptionTriggers = config ? (config.triggers ? (config.triggers.twitch ? (config.triggers.twitch.redemption) : null) : null) : null;
		profile.rewards = redemptionTriggers ? Object.keys(redemptionTriggers) : [];
	},
	async onProfilesChanged(activeProfiles, inactiveProfiles) {
		let activeRewards = new Set();
		let inactiveRewards = new Set();
		//Handle rewards
		for (let activeProf of activeProfiles) {
			for (let reward of activeProf.rewards) {
				activeRewards.add(reward);
			}
		}

		for (let rewardKey in this.rewardsDefinitions.data) {
			if (!activeRewards.has(rewardKey)) {
				inactiveRewards.add(rewardKey);
			}
		}

		//Set all the reward states.
		await this.switchChannelRewards(activeRewards, inactiveRewards);
	},
	async onSettingsReload() {
		await this.shutdown();

		await this.doInitialAuth();
	},
	async onSecretsReload() {
		await this.shutdown();

		await this.doInitialAuth();
	},
	settings: {
		auxiliaryChannel: { type: String, name: "Auxiliary Chat Channel" },
	},
	secrets: {
		apiClientId: { type: String },
	},
	state: {
		channelName: {
			type: String,
			name: "Twitch Channel Name",
			description: "The active channel's Name"
		},
		channelProfileUrl: {
			type: String,
			name: "Twitch Channel Profile Picture URL"
		},
		botName: {
			type: String,
			name: "Bot Name",
			description: "The chat bot's Name"
		},
		botProfileUrl: {
			type: String,
			name: "Twitch Channel Profile Picture URL"
		},
		subscribers: {
			type: Number,
			name: "Number of Twitch Subscribers",
		},
		followers: {
			type: Number,
			name: "Number of Twitch Followers"
		},
		viewers: {
			type: Number,
			name: "Number of Twitch Viewers",
			default: 0,
		},
		isAuthed: {
			type: Boolean,
			name: "Is Authed",
			description: "True if the user is completely authenticated."
		},
		isAffiliate: {
			type: Boolean,
			name: "Is Affiliate",
			description: "True if the user is at least affiliate"
		}
	},
	triggers: {
		chat: {
			name: "Chat Command",
			description: "Fires when any user chats.",
			config: {
				type: Object,
				properties: {
					command: { type: String, name: "Command" },
					match: { type: String, enum: ["Start", "Anywhere"], default: "Start", preview: false, name: "Match" },
					permissions: {
						type: Object,
						properties: {
							viewer: { type: Boolean, name: "Viewer", default: true, required: true },
							sub: { type: Boolean, name: "Subscriber", default: true, required: true },
							vip: { type: Boolean, name: "VIP", default: true, required: true },
							mod: { type: Boolean, name: "Moderator", default: true, required: true },
							streamer: { type: Boolean, name: "Streamer", default: true, required: true },
						},
						preview: false,
					},
				}
			},
			context: {
				command: { type: String },
				user: { type: String },
				userId: { type: String },
				args: { type: String },
				argString: { type: String },
				userColor: { type: String },
				message: { type: String },
				filteredMessage: { type: String },
			},
			handler(config, context, mapping, userInfo) {
				if (config.match == "Start") {
					if (context.command != config.command.toLowerCase()) {
						return false;
					}
				}
				if (config.match == "Anywhere") {
					console.log("Checking for anywhere match ", context.message.toLowerCase(), " : ", config.command.toLowerCase());
					if (!context.message.toLowerCase().includes(config.command.toLowerCase())) {
						return false;
					}
				}

				if (config.permissions) {
					if (config.permissions.viewer) {
						return true;
					}
					if (userInfo.isMod && config.permissions.mod) {
						return true;
					}
					if (userInfo.isVip && config.permissions.vip) {
						return true;
					}
					if (userInfo.isSubscriber && config.permissions.sub) {
						return true;
					}
					if (userInfo.isBroadcaster && config.permissions.streamer) {
						return true;
					}
				}

				return false;
			}
		},
		redemption: {
			name: "Channel Points Redemption",
			description: "Fires for when a channel point reward is redeemed",
			config: {
				type: Object,
				properties: {
					reward: { type: "ChannelPointReward" },
				},
			},
			context: {
				reward: { type: String },
				user: { type: String },
				userId: { type: String },
				userColor: { type: String },
				message: { type: String },
				filteredMessage: { type: String }
			},
			handler(config, context) {
				return context.reward == config.reward;
			}
		},
		follow: {
			name: "New Follower",
			description: "Fires for when a user follows.",
			type: "SingleTrigger",
			context: {
				user: { type: String },
				userId: { type: String },
				userColor: { type: String },
			},
		},
		firstTimeChat: {
			name: "First Time Chatter",
			description: "Fires for when a user chats for the very first time in the channel.",
			type: "SingleTrigger",
			context: {
				command: { type: String },
				user: { type: String },
				userId: { type: String },
				args: { type: String },
				argString: { type: String },
				userColor: { type: String },
				message: { type: String },
				filteredMessage: { type: String },
			},
		},
		subscribe: {
			name: "Subscription",
			description: "Fires for when a user subscribes. Based on total number of months subscribed.",
			config: {
				type: Object,
				properties: {
					months: { type: "Range", name: "Months Subbed" },
				},
			},
			context: {
				months: { type: Number },
				user: { type: String },
				userId: { type: String },
				userColor: { type: String },
			},
			handler(config, context) {
				return inRange(context.months, config.months);
			}
		},
		giftedSub: {
			name: "Gifted Subscription",
			description: "Fires for when a user gifts subs. Based on the number of subs gifted..",
			config: {
				type: Object,
				properties: {
					subs: { type: "Range", name: "Subs Gifted" },
				},
			},
			context: {
				subs: { type: Number },
				user: { type: String },
				userId: { type: String },
				userColor: { type: String },
			},
			handler(config, context) {
				return inRange(context.subs, config.subs);
			}
		},
		bits: {
			name: "Bits Cheered",
			description: "Fires for when a user cheers with bits",
			config: {
				type: Object,
				properties: {
					bits: { type: "Range", name: "Bits Cheered" },
				},
			},
			context: {
				bits: { type: Number },
				user: { type: String },
				userId: { type: String },
				userColor: { type: String },
			},
			handler(config, context) {
				return inRange(context.bits, config.bits);
			}
		},
		raid: {
			name: "Incoming Raid",
			description: "Fires when a raid start",
			config: {
				type: Object,
				properties: {
					raiders: { type: "Range", name: "Viewers" },
				},
			},
			context: {
				raiders: { type: Number },
				user: { type: String },
				userId: { type: String },
				userColor: { type: String },
			},
			handler(config, context) {
				return inRange(context.raiders, config.raiders);
			}
		}
	},
	actions: {
		sendChat: {
			name: "Chat",
			description: "Sends a message in twitch chat.",
			icon: "mdi-chat",
			color: "#5E5172",
			data: {
				type: String,
				template: true,
			},
			async handler(message, context) {
				await this.chatClient.say(this.state.channelName.toLowerCase(), await template(message, context));
			}
		},
		streamTitle: {
			name: "Change Stream Title",
			description: "Change the stream title",
			icon: "mdi-cursor-text",
			color: "#5E5172",
			data: {
				type: String,
				template: true,
			},
			async handler(message, context) {
				await this.channelTwitchClient.channels.updateChannelInfo(this.channelId, {
					title: await template(message, context)
				})
			}
		},
		runAd: {
			name: "Run Ad",
			description: "Run an ad",
			icon: "mdi-advertisements",
			color: "#5E5172",
			data: {
				type: String,
				enum: ["30 Seconds", "60 Seconds", "90 Seconds"]
			},
			async handler(duration) {
				const lookup = {
					"30 Seconds": 30,
					"60 Seconds": 60,
					"90 Seconds": 90,
				}
				await this.channelTwitchClient.channels.startChannelCommercial(this.channelId, lookup[duration]);
			}
		},
		streamMarker: {
			name: "Place Stream Marker",
			description: "Places a marker in the stream for use in the video editor",
			icon: "mdi-map-marker-star",
			color: "#5E5172",
			data: {
				type: String,
				template: true,
			},
			async handler(message, context) {
				await this.channelTwitchClient.streams.createStreamMarker(this.channelId, await template(message, context));
			}
		}
	},
	templateFunctions: {
		async followAge(userId) {
			const follow = await this.channelTwitchClient.users.getFollowFromUserToBroadcaster(userId, this.channelId);

			if (!follow) {
				return "Not Following";
			}

			const now = new Date();
			const diff = dateInterval(follow.followDate, now);

			let result = "";

			if (diff.years > 0) {
				result += ` ${diff.years} year${diff.years > 1 ? 's' : ''}`;
			}

			if (diff.months > 0) {
				result += ` ${diff.months} month${diff.months > 1 ? 's' : ''}`;
			}

			if (diff.days > 0) {
				result += ` ${diff.days} day${diff.days > 1 ? 's' : ''}`;
			}

			if (diff.hours > 0) {
				result += ` ${diff.hours} hour${diff.hours > 1 ? 's' : ''}`
			}

			if (result.length == 0) {
				result = "Just Followed";
			}

			return result;
		},
		async getStreamCategory(userId) {
			const channelInfo = await this.channelTwitchClient.channels.getChannelInfoById(userId);
			return channelInfo.gameName;
		}
	},

	settingsView: 'twitch.vue'
}


