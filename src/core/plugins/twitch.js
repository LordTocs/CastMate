const { ElectronAuthManager } = require("../utils/twitchAuth");

const { ApiClient } = require("twitch");

const { ChatClient } = require("twitch-chat-client");

const { PubSubClient, BasicPubSubClient } = require("twitch-pubsub-client");

const { template } = require('../utils/template');
const { evalTemplate } = require('../utils/template');
const HotReloader = require("../utils/hot-reloader");

const BadWords = require("bad-words");

const { rewardsFilePath } = require("../utils/configuration");

const { WebSocket } = require('ws');

const axios = require('axios');
const logger = require("../utils/logger");


//https://stackoverflow.com/questions/1968167/difference-between-dates-in-javascript/27717994
function dateInterval(date1, date2)
{
	if (date1 > date2)
	{ // swap
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
	if (result.hours < 0)
	{
		result.days--;
		result.hours += 24;
	}
	if (result.days < 0)
	{
		result.months--;
		// days = days left in date1's month, 
		//   plus days that have passed in date2's month
		var copy1 = new Date(date1.getTime());
		copy1.setDate(32);
		result.days = 32 - date1.getDate() - copy1.getDate() + date2.getDate();
	}
	if (result.months < 0)
	{
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
	async init()
	{
		this.logger.info("Starting Twitch");

		await this.doInitialAuth();

		this.colorCache = {};

		this.filter = new BadWords();//{ emptyList: true }); //Temporarily Disable the custom bad words list.
		//this.filter.addWords(...badwordList.words);
	},
	methods: {
		filterMessage(message)
		{
			if (!message || message.length < 2)
				return message;

			if (!this.filter)
				return "";

			try
			{
				return this.filter.clean(message)
			}
			catch (err)
			{
				return ""
			}
		},

		async doInitialAuth()
		{
			let clientId = this.secrets.apiClientId || "qnybd4aoxlom3u3wjbsstsp5yd2sdl"

			this.channelAuth = new ElectronAuthManager({ clientId, redirectUri: `http://localhost/auth/channel/redirect`, name: "Channel" })
			this.botAuth = new ElectronAuthManager({ clientId, redirectUri: `http://localhost/auth/channel/redirect`, name: "Bot" })

			await this.channelAuth.trySilentAuth();
			await this.botAuth.trySilentAuth();

			await this.completeAuth();

		},

		async shutdown()
		{
			if (this.chatClient)
			{
				await this.chatClient.quit();
			}

			if (this.basePubSubClient)
			{
				this.basePubSubClient.disconnect();
			}

			if (this.castMateWebsocket)
			{
				//Flag so the automatic reconnect does not run
				this.castMateWebsocketReconnect = false;
				this.castMateWebsocket.terminate();
				this.castMateWebsocket = null;
			}
		},

		async completeAuth()
		{
			if (!this.channelAuth || !this.channelAuth.isAuthed || !this.botAuth || !this.botAuth.isAuthed)
			{
				this.logger.info("Failed to complete auth.");
				this.logger.info(`  Channel Auth ${this.channelAuth ? this.channelAuth.isAuthed : 'None'}`)
				this.logger.info(`  Bot     Auth ${this.botAuth ? this.botAuth.isAuthed : 'None'}`)
				return;
			}

			await this.shutdown();

			try
			{
				await this.doAuth();
			}
			catch (err)
			{
				this.logger.error(`Failed to Auth`);
				this.logger.error(`${err}`);
			}

			try
			{
				await this.setupChatTriggers();
			}
			catch (err)
			{
				this.logger.error(`Failed to setup Chat Triggers`);
				this.logger.error(`${err}`);
			}

			try
			{
				await this.setupCastMateWebsocketWorkaround();
			}
			catch (err)
			{
				this.logger.error(`Failed to setup Websocket Workaround`);
				this.logger.error(`${err}`);
			}

			try
			{
				await this.setupPubSubTriggers();
			}
			catch (err)
			{
				this.logger.error(`Failed to set up PubSub Triggers`);
				this.logger.error(`${err}`);
			}

			await this.initConditions();

			try
			{
				await this.initChannelRewards();
			}
			catch (err)
			{
				this.logger.error(`Failed to setup Channel Rewards`);
				this.logger.error(`${err}`);
			}
		},

		async doAuth()
		{
			this.chatAuthProvider = null;

			this.channelTwitchClient = new ApiClient({
				authProvider: this.channelAuth,
			});

			this.botTwitchClient = new ApiClient({
				authProvider: this.botAuth
			});

			//Get the IDs
			let channel = await this.channelTwitchClient.helix.users.getMe(false);
			this.state.channelName = channel.displayName;
			this.channelId = await channel.id;
			let bot = await this.botTwitchClient.helix.users.getMe(false);
			this.botId = await bot.id;
			this.state.botName = bot.displayName;
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
			this.chatClient = new ChatClient(this.botAuth, { channels: [this.state.channelName] });
			await this.chatClient.connect();

			this.logger.info(`Connected to Chat`);

			//Setup triggers
			this.chatClient.onMessage(async (channel, user, message, msgInfo) =>
			{
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

				if (msgInfo.userInfo.isMod || msgInfo.userInfo.isBroadcaster)
				{
					if (this.actions.trigger('modchat', context))
					{
						return;
					}
				}

				if (msgInfo.userInfo.isVip)
				{
					if (this.actions.trigger('vipchat', context))
					{
						return;
					}
				}

				if (msgInfo.userInfo.isSubscriber)
				{
					if (this.actions.trigger('subchat', context))
					{
						return;
					}
				}

				if (this.actions.trigger('chat', context))
				{
					return;
				}

			});

			this.chatClient.onRaid((channel, user, raidInfo) =>
			{
				this.actions.trigger("raid", { number: raidInfo.viewerCount, user: raidInfo.displayName });
			})

			this.chatClient.onCommunitySub((channel, user, subInfo) =>
			{
				this.actions.trigger("giftedSub", { number: subInfo.count, user: subInfo.gifterDisplayName, userId: subInfo.gifterUserId, userColor: this.colorCache[subInfo.gifterUserId] })
			});
		},

		async retryWebsocketWorkaround()
		{
			if (this.castMateWebsocket)
			{
				this.castMateWebsocket.terminate();
			}

			this.castMateWebsocket = null;

			//Retry connection in 5 seconds.
			if (this.castMateWebsocketReconnect)
			{
				this.logger.info(`Connection to castmate websocket failed, retrying in 5 seconds...`);
				setTimeout(() =>
				{
					this.setupCastMateWebsocketWorkaround().catch(err =>
					{
						this.logger.error(`Exception on socket reconnect.`);
						this.logger.error(`${err}`);
						this.retryWebsocketWorkaround();
					})
				}, 5000);
			}
		},

		async setupCastMateWebsocketWorkaround() 
		{
			this.followerCache = new Set();

			this.castMateWebsocketReconnect = true;

			this.castMateWebsocket = new WebSocket('wss://castmate-websocket.herokuapp.com', {
				headers: {
					Authorization: `Bearer ${this.channelAuth._accessToken.accessToken}`,
				}
			});

			this.castMateWebsocket.on('open', () =>
			{
				this.logger.info(`Connection to castmate websocket open`);
			})

			this.castMateWebsocket.on('message', async (data) =>
			{
				let message = null;
				try
				{
					message = JSON.parse(data);
				}
				catch
				{
					console.error("Unable to parse", data);
				}

				if (!message)
					return;

				if (message.event == "follow")
				{
					if (this.followerCache.has(message.userId))
						return;

					this.followerCache.add(message.userId);

					this.logger.info(`followed by ${message.userDisplayName}`);
					this.actions.trigger('follow', { user: message.userDisplayName, userId: message.userId, ...{ userColor: this.colorCache[message.userId] } });

					let follows = await this.channelTwitchClient.helix.users.getFollows({ followedUser: this.channelId });
					this.state.followers = follows.total;
				}
			});

			this.castMateWebsocket.on('close', () =>
			{
				this.retryWebsocketWorkaround();
			});

			this.castMateWebsocket.on('unexpected-response', (request, response) =>
			{
				this.logger.error(`Unexpected Response!`);
				console.log(response);
				this.retryWebsocketWorkaround();
				if (response.status == 200)
				{
					this.logger.info(`It's the mysterious 200 response!`);

				}
			})
		},

		async setupPubSubTriggers()
		{
			this.basePubSubClient = new BasicPubSubClient();
			this.pubSubClient = new PubSubClient(this.basePubSubClient);
			await this.pubSubClient.registerUserListener(this.channelTwitchClient, this.channelId);

			await this.pubSubClient.onBits(this.channelId, (message) =>
			{
				this.logger.info(`Bits: ${message.bits}`);


				this.actions.trigger("bits", {
					number: message.bits,
					user: message.userName,
					userId: message.userId,
					message: message.message,
					filteredMessage: this.filterMessage(message.message),
					...{ userColor: this.colorCache[message.userId] }
				});
			});

			await this.pubSubClient.onRedemption(this.channelId, (redemption) =>
			{
				this.logger.info(`Redemption: ${redemption.rewardId} ${redemption.rewardName}`);
				let message = redemption.message;
				if (!message)
				{
					message = "";
				}

				this.actions.trigger("redemption", {
					enum: redemption.rewardName,
					message,
					filteredMessage: this.filterMessage(message),
					user: redemption.userDisplayName,
					userId: redemption.userId,
					//...{ userColor: this.colorCache[redemption.userId] }
				});
			});

			await this.pubSubClient.onSubscription(this.channelId, async (message) =>
			{
				if (message.isGift)
				{
					/*this.logger.info(`Gifted sub ${message.gifterDisplayName} -> ${message.userDisplayName}`);
					this.actions.trigger('subscribe', { name: "gift", gifter: message.gifterDisplayName, user: message.userDisplayName, userId: message.userId, ...{ userColor: this.colorCache[message.userId] } });*/
					return; //Handle gifted subs elsewhere
				}
				else
				{
					let months = message.months ? message.months : 0;
					this.logger.info(`Sub ${message.userDisplayName} : ${months}`);
					this.actions.trigger('subscribe', { number: months, user: message.userDisplayName, userId: message.userId, prime: message.subPlan == "Prime", ...{ userColor: this.colorCache[message.userId] } })
				}

				this.state.subscribers = await this.channelTwitchClient.kraken.channels.getChannelSubscriptionCount(this.channelId);
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

			this.state.subscribers = await this.channelTwitchClient.kraken.channels.getChannelSubscriptionCount(this.channelId);
			let follows = await this.channelTwitchClient.helix.users.getFollows({ followedUser: this.channelId });
			this.state.followers = follows.total;
		},

		async initChannelRewards()
		{
			this.rewardsDefinitions = new HotReloader(rewardsFilePath,
				() =>
				{
					this.ensureChannelRewards()
				},
				() => { })
			await this.ensureChannelRewards();
		},

		async ensureChannelRewards()
		{
			let rewards = await this.channelTwitchClient.helix.channelPoints.getCustomRewards(this.channelId, true);

			let handledRewards = new Set();

			for (let reward of rewards)
			{
				if (!(reward.title in this.rewardsDefinitions.data))
				{
					//Not in the file, delete it.
					await this.channelTwitchClient.helix.channelPoints.deleteCustomReward(this.channelId, reward.id);
				}
				else
				{
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

					if (needsUpdate)
					{
						await this.channelTwitchClient.helix.channelPoints.updateCustomReward(this.channelId, reward.id, {
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
			for (let rewardKey in this.rewardsDefinitions.data)
			{
				if (handledRewards.has(rewardKey))
					continue;

				let rewardDef = this.rewardsDefinitions.data[rewardKey];


				//inputRequired: false
				//skipQueue: true
				//Create the new reward.
				try
				{
					await this.channelTwitchClient.helix.channelPoints.createCustomReward(this.channelId, {
						title: rewardKey,
						prompt: rewardDef.description,
						cost: rewardDef.cost,
						userInputRequired: !!rewardDef.inputRequired,
						autoFulfill: !!rewardDef.skipQueue,
						globalCooldown: rewardDef.cooldown || 0,
						maxRedemptionsPerStream: rewardDef.maxRedemptionsPerStream || null,
						maxRedemptionsPerUserPerStream: rewardDef.maxRedemptionsPerUserPerStream || null,
					})
				} catch (err)
				{
					this.logger.error(`Error creating channel reward: ${rewardKey}. Message: ${err}`);
				}
			}
		},

		async switchChannelRewards(activeRewards, inactiveRewards)
		{
			if (!this.channelId)
				return;

			let rewards = await this.channelTwitchClient.helix.channelPoints.getCustomRewards(this.channelId, true);

			for (let reward of rewards)
			{
				if (!reward.isEnabled && activeRewards.has(reward.title))
				{
					await this.channelTwitchClient.helix.channelPoints.updateCustomReward(this.channelId, reward.id, { isPaused: false, isEnabled: true });
				}
				else if (reward.isEnabled && inactiveRewards.has(reward.title))
				{
					await this.channelTwitchClient.helix.channelPoints.updateCustomReward(this.channelId, reward.id, { isPaused: false, isEnabled: false });
				}
			}
		}
	},
	ipcMethods: {
		async getAuthStatus()
		{
			return {
				bot: this.botAuth ? this.state.botName : null,
				channel: this.channelAuth ? this.state.channelName : false,
			}
		},

		async doBotAuth()
		{
			let result = await this.botAuth.doAuth(true);
			if (result)
			{
				await this.completeAuth();
			}
		},

		async doChannelAuth()
		{
			let result = await this.channelAuth.doAuth(true);
			if (result)
			{
				await this.completeAuth();
			}
		},

		async searchCategories(query = "")
		{
			try
			{
				const categories = await this.channelTwitchClient.helix.search.searchCategories(query);
				const pojoCategories = [];

				for (let cat of categories.data)
				{
					pojoCategories.push({
						id: cat.id,
						name: cat.name,
						boxArtUrl: cat.boxArtUrl
					})
				}

				return pojoCategories;
			}
			catch (err)
			{
				console.error(err);
			}
		},

		async getCategoryById(id)
		{
			if (!this.channelTwitchClient)
				return null;
			const category = await this.channelTwitchClient.helix.games.getGameById(id);
			if (category)
			{
				return { name: category.name, id: category.id, boxArtUrl: category.boxArtUrl };
			}
			return null;
		},

		async getAllTags()
		{
			if (!this.channelAuth || !this.channelAuth.isAuthed)
				return [];

			const pageniator = this.channelTwitchClient.helix.tags.getAllStreamTagsPaginated();

			const tags = await pageniator.getAll();
			const pojoTags = []

			for (let tag of tags)
			{
				if (!tag.isAuto)
				{
					pojoTags.push({ id: tag.id, name: tag.getName("en-us") })
				}
			}

			return pojoTags;
		},

		async updateStreamInfo(info)
		{
			console.log(this.channelId);

			await this.channelTwitchClient.helix.channels.updateChannelInfo(this.channelId, {
				title: info.title,
				gameId: info.category,
			})

			//Awaiting fix from d-fisher
			//await this.channelTwitchClient.helix.streams.replaceStreamTags(this.channelId, info.tags);

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
	async onProfileLoad(profile, config)
	{
		profile.rewards = config.rewards || [];
	},
	async onProfilesChanged(activeProfiles, inactiveProfiles)
	{
		let activeRewards = new Set();
		let inactiveRewards = new Set();
		//Handle rewards
		for (let activeProf of activeProfiles)
		{
			for (let reward of activeProf.rewards)
			{
				activeRewards.add(reward);
			}
		}

		for (let inactiveProf of inactiveProfiles)
		{
			for (let reward of inactiveProf.rewards)
			{
				inactiveRewards.add(reward);
			}
		}

		//Set all the reward states.
		//Hackily reach inside twitch plugin.
		this.switchChannelRewards(activeRewards, inactiveRewards);
	},
	async onSettingsReload()
	{
		await this.shutdown();

		await this.doInitialAuth();
	},
	async onSecretsReload()
	{
		await this.shutdown();

		await this.doInitialAuth();
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
		botName: {
			type: String,
			name: "Bot Name",
			description: "The chat bot's Name"
		},
		subscribers: {
			type: Number,
			name: "Twitch Subscribers",
		},
		followers: {
			type: Number,
			name: "Twitch Followers"
		}
	},
	triggers: {
		chat: {
			name: "Chat",
			description: "Fires when any user chats.",
			type: "CommandTrigger"
		},
		subchat: {
			name: "Sub Chat",
			description: "Fires for only subscribed user chats",
			type: "CommandTrigger"
		},
		vipchat: {
			name: "VIP Chat",
			description: "Fires for only VIP user chats",
			type: "CommandTrigger"
		},
		modchat: {
			name: "Mod Chat",
			description: "Fires for when a mod or the broadcaster chats",
			type: "CommandTrigger"
		},
		redemption: {
			name: "Channel Points Redemption",
			description: "Fires for when a channel point reward is redeemed",
			type: "EnumTrigger",
			async enum()
			{
				return Object.keys(this.rewardsDefinitions.data || {});
			}
		},
		follow: {
			name: "Follow",
			description: "Fires for when a user follows.",
			type: "SingleTrigger"
		},
		subscribe: {
			name: "Subscription",
			description: "Fires for when a user subscribes. Based on total number of months subscribed.",
			type: "NumberTrigger",
			numberText: "Months Subbed"
		},
		giftedSub: {
			name: "Gifted Subs",
			description: "Fires for when a user subscribes. Based on the number of subs gifted..",
			type: "NumberTrigger",
			numberText: "Subs Gifted"
		},
		bits: {
			name: "Cheered",
			description: "Fires for when a user cheers with bits",
			type: "NumberTrigger",
			numberText: "Bits Cheered"
		},
		raid: {
			name: "Raid",
			description: "Fires when a raid start",
			type: "NumberTrigger",
			numberText: "Raiders"
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
			async handler(message, context)
			{
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
			async handler(message, context)
			{
				await this.channelTwitchClient.helix.channels.updateChannelInfo(this.channelId, {
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
			async handler(duration)
			{
				const lookup = {
					"30 Seconds": 30,
					"60 Seconds": 60,
					"90 Seconds": 90,
				}
				await this.channelTwitchClient.helix.channels.startChannelCommercial(this.channelId, lookup[duration]);
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
			async handler(message, context)
			{
				await this.channelTwitchClient.helix.streams.createStreamMarker(this.channelId, await template(message, context));
			}
		}
	},
	templateFunctions: {
		async followAge(user)
		{
			const follow = await this.channelTwitchClient.helix.users.getFollowFromUserToBroadcaster(user, this.channelId);

			if (!follow)
			{
				return "Not Following";
			}

			const now = new Date();
			const diff = dateInterval(follow.followDate, now);

			let result = "";

			if (diff.years > 0)
			{
				result += ` ${diff.years} year${diff.years > 1 ? 's' : ''}`;
			}

			if (diff.months > 0)
			{
				result += ` ${diff.months} month${diff.months > 1 ? 's' : ''}`;
			}

			if (diff.days > 0)
			{
				result += ` ${diff.days} day${diff.days > 1 ? 's' : ''}`;
			}

			if (diff.hours > 0)
			{
				result += ` ${diff.hours} hour${diff.hours > 1 ? 's' : ''}`
			}

			if (result.length == 0)
			{
				result = "Just Followed";
			}

			return result;
		}
	},
	settingsView: 'twitch.vue'
}


