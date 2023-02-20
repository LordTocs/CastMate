import { ElectronAuthManager } from "../utils/twitchAuth.js"
import { ApiClient } from "@twurple/api"
import { ChatClient } from "@twurple/chat"
import { PubSubClient, BasicPubSubClient } from "@twurple/pubsub"
import { EventSubWsListener } from "@twurple/eventsub-ws"
import { template, templateNumber } from "../state/template.js"
import BadWords from "bad-words"
import fs from "fs"
import path from "path"
import { WebSocket } from "ws"
import axios from "axios"
import { inRange } from "../utils/range.js"
import { userFolder } from "../utils/configuration.js"
import _ from "lodash"
import { OverlayManager } from "../overlays/overlay-manager.js"

//https://stackoverflow.com/questions/1968167/difference-between-dates-in-javascript/27717994
function dateInterval(date1, date2) {
	if (date1 > date2) {
		// swap
		var result = dateInterval(date2, date1)
		result.years = -result.years
		result.months = -result.months
		result.days = -result.days
		result.hours = -result.hours
		return result
	}
	result = {
		years: date2.getYear() - date1.getYear(),
		months: date2.getMonth() - date1.getMonth(),
		days: date2.getDate() - date1.getDate(),
		hours: date2.getHours() - date1.getHours(),
	}
	if (result.hours < 0) {
		result.days--
		result.hours += 24
	}
	if (result.days < 0) {
		result.months--
		// days = days left in date1's month,
		//   plus days that have passed in date2's month
		var copy1 = new Date(date1.getTime())
		copy1.setDate(32)
		result.days = 32 - date1.getDate() - copy1.getDate() + date2.getDate()
	}
	if (result.months < 0) {
		result.years--
		result.months += 12
	}
	return result
}

/**
 * Runs the string matching algorithm chosen by matchType on input with compare
 *
 * @param {String} input
 * @param {String | RegExp} compare
 * @param {String} matchType
 * @returns { Boolean | Array }
 */
function doMatch(input, compare, matchType) {
	const inputLower = input.toLowerCase()
	const compareLower = compare.toLowerCase()

	if (input.length > 0 && matchType == "Start") {
		if (!compare || compare.length == 0) {
			//For Start, if the compare is empty we always match.
			return true
		}

		//Make sure the input starts with the compare and the next character is either non-existant (eos) or a delimeter
		if (
			inputLower.startsWith(compareLower) &&
			(inputLower[compareLower.length] == undefined ||
				inputLower[compareLower.length] == " ")
		) {
			return true
		}
	}
	if (input.length > 0 && matchType == "Anywhere") {
		if (!compare || compare.length == 0) {
			//For Anywhere, if the compare is empty we always match.
			return true
		}

		if (inputLower.includes(compareLower)) {
			return true
		}
	}
	let matches = undefined
	if (input.length > 0 && matchType === "Regex") {
		const regexp =
			compare instanceof RegExp ? compare : new RegExp(config.command)
		matches = input.match(regexp)
		if (!matches) {
			return false
		}
		return matches
	}
}

export default {
	name: "twitch",
	uiName: "Twitch",
	icon: "mdi-twitch",
	color: "#5E5172",
	async init() {
		this.logger.info("Starting Twitch")

		this.rewards = []

		await this.doInitialAuth()

		this.colorCache = {}

		this.state.viewers = 0

		this.commandTimes = {}

		let badwords = []
		const badwordsFile = path.join(userFolder, "data", "badwords.json")
		if (fs.existsSync(badwordsFile)) {
			try {
				badwords = JSON.parse(
					await fs.promises.readFile(badwordsFile, "utf-8")
				).words
			} catch {}
		}

		this.filter = new BadWords({ emptyList: badwords.length > 0 })
		if (badwords.length > 0) {
			this.filter.addWords(...badwords)
		}
	},
	methods: {
		filterMessage(message) {
			if (!message || message.length < 2) return message

			if (!this.filter) return ""

			try {
				return this.filter.clean(message)
			} catch (err) {
				return ""
			}
		},

		async doInitialAuth() {
			let clientId =
				this.secrets.apiClientId || "qnybd4aoxlom3u3wjbsstsp5yd2sdl"

			this.channelAuth = new ElectronAuthManager({
				clientId,
				redirectUri: `http://localhost/auth/channel/redirect`,
				name: "Channel",
			})
			this.botAuth = new ElectronAuthManager({
				clientId,
				redirectUri: `http://localhost/auth/channel/redirect`,
				name: "Bot",
				scopes: ["chat:edit", "chat:read"],
			})

			const [channelAuthResult, botAuthResult] = await Promise.all([
				this.channelAuth.trySilentAuth(),
				await this.botAuth.trySilentAuth(),
			])

			if (channelAuthResult.error == "scopes_changed") {
				this.state.scopesChanged = true
			}

			await this.completeAuth()
		},

		async shutdown() {
			this.state.botName = null
			this.state.channelName = null
			this.rewards = []

			if (this.chatClient) {
				await this.chatClient.quit()
				this.chatClient = null
			}

			if (this.basePubSubClient) {
				this.basePubSubClient.disconnect()
				this.basePubSubClient = null
				this.pubSubClient = null
			}

			if (this.eventSubClient) {
				this.eventSubClient.stop()
				this.eventSubClient = null
			}
		},

		async completeAuth() {
			await this.shutdown()

			try {
				await this.createApiClients()
			} catch (err) {
				this.logger.error(`Failed to create api clients`)
				this.logger.error(`${err}`)
			}

			if (!this.channelAuth || !this.channelAuth.isAuthed) {
				this.logger.info("Failed to complete auth.")
				this.logger.info("  Channel Is Not Authed.")
				this.state.isAuthed = false
				return
			}

			this.state.scopesChanged = false

			if (!this.botAuth || !this.botAuth.isAuthed) {
				this.logger.info("No bot account authed.")
			}

			this.state.isAuthed = true

			//Set some analytics
			this.analytics.setUserId(this.state.channelId)
			this.analytics.set({
				$first_name: this.state.channelName,
			})
			this.analytics.track("twitchAuth")

			if (this.botId) {
				this.analytics.set({
					botId: this.botId,
					$last_name: this.state.botName,
				})
			}

			await this.webServices.websocketServer.broadcast(
				JSON.stringify({
					channel: {
						channelId: this.state.channelId,
						channelName: this.state.channelName,
					},
				})
			)

			try {
				await this.setupChatTriggers()
			} catch (err) {
				this.logger.error(`Failed to setup Chat Triggers`)
				this.logger.error(`${err}`)
			}

			try {
				await this.setupEventSubTriggers()
			} catch (err) {
				this.logger.error(`Failed to setup EventSub`)
				this.logger.error(`${err}`)
			}

			try {
				await this.setupPubSubTriggers()
			} catch (err) {
				this.logger.error(`Failed to set up PubSub Triggers`)
				this.logger.error(`${err}`)
			}

			await this.initConditions()

			try {
				await this.initChannelRewards()
			} catch (err) {
				this.logger.error(`Failed to setup Channel Rewards`)
				this.logger.error(`${err}`)
			}
		},

		async createApiClients() {
			this.chatAuthProvider = null

			if (this.channelAuth && this.channelAuth.isAuthed) {
				this.channelTwitchClient = new ApiClient({
					authProvider: this.channelAuth,
				})

				let channel = await this.channelTwitchClient.users.getMe(false)
				this.state.channelName = channel.displayName
				this.state.channelProfileUrl = channel.profilePictureUrl
				this.state.channelId = await channel.id
				this.state.accessToken =
					this.channelAuth._accessToken.accessToken

				this.state.isAffiliate = channel.broadcasterType.length > 0

				this.chatAuthProvider = this.channelAuth
				this.logger.info(`Channel Signed in As ${channel.displayName}`)
			} else {
				this.state.channelName = null
				this.state.channelProfileUrl = null

				this.state.isAffiliate = false

				this.state.channelId = null

				this.logger.info(`Channel Not Signed In`)
			}

			if (this.botAuth && this.botAuth.isAuthed) {
				this.botTwitchClient = new ApiClient({
					authProvider: this.botAuth,
				})

				let bot = await this.botTwitchClient.users.getMe(false)

				this.state.botName = bot.displayName
				this.state.botProfileUrl = bot.profilePictureUrl
				this.chatAuthProvider = this.botAuth
				this.botId = await bot.id
				this.logger.info(`Bot Signed in As ${bot.displayName}`)
			} else {
				this.state.botName = null
				this.state.botProfileUrl = null
				this.botId = null
				this.logger.info(`Bot Not Signed In`)
			}
		},

		parseMessage(message) {
			let firstSpace = message.indexOf(" ")

			if (firstSpace == -1) {
				return { command: message.toLowerCase(), args: [], string: "" }
			}

			let command = message.substr(0, firstSpace).toLowerCase()

			let string = message.substr(firstSpace + 1)

			let args = string.split(" ").filter((arg) => arg.length != 0)

			return { command, args, string }
		},

		async setupChatTriggers() {
			this.chatClient = new ChatClient({
				authProvider: this.chatAuthProvider,
				channels: [
					this.state.channelName,
					...(this.settings.auxiliaryChannel
						? [this.settings.auxiliaryChannel]
						: []),
				],
			})
			await this.chatClient.connect()

			this.logger.info(`Connected to Chat`)

			//Setup triggers
			this.chatClient.onMessage(
				async (channel, user, message, msgInfo) => {
					if (this.colorCache)
						this.colorCache[msgInfo.userInfo.userId] =
							msgInfo.userInfo.color

					this.webServices.websocketServer.broadcast(
						JSON.stringify({
							chat: {
								user,
								color: msgInfo.userInfo.color,
								message,
								emoteOffsets: Object.fromEntries(
									msgInfo.emoteOffsets
								),
							},
						})
					)

					OverlayManager.getInstance().broadcastOverlayFunc(
						"onTwitchChat",
						{
							message,
							user,
							userId: msgInfo.userInfo.userId,
							color: msgInfo.userInfo.color,
							emoteOffsets: Object.fromEntries(
								msgInfo.emoteOffsets
							),
						}
					)

					let parsed = this.parseMessage(message)

					const context = {
						command: parsed.command,
						user: msgInfo.userInfo.displayName,
						userId: msgInfo.userInfo.userId,
						args: parsed.args,
						argString: parsed.string,
						userColor: msgInfo.userInfo.color,
						message,
						filteredMessage: this.filterMessage(message),
					}

					if (msgInfo.tags.get("first-msg") !== "0") {
						this.triggers.firstTimeChat(context)
					}

					this.triggers.chat(context, msgInfo.userInfo)
				}
			)

			this.chatClient.onRaid((channel, user, raidInfo, msgInfo) => {
				this.triggers.raid({
					raiders: raidInfo.viewerCount,
					user: raidInfo.displayName,
					userId: msgInfo.userInfo.userId,
				})
			})

			this.chatClient.onBan((channel, user, msg) => {
				this.triggers.ban({
					user,
				})
			})

			this.chatClient.onTimeout((channel, user, msg) => {
				this.triggers.timeout({
					user,
				})
			})

			//See here https://twurple.js.org/docs/examples/chat/sub-gift-spam.html
			const giftCounts = new Map()

			this.chatClient.onCommunitySub((channel, user, subInfo) => {
				const previousGiftCount = giftCounts.get(user) || 0
				giftCounts.set(user, previousGiftCount + subInfo.count)
				this.triggers.giftedSub({
					subs: subInfo.count,
					user: subInfo.gifterDisplayName,
					userId: subInfo.gifterUserId,
					userColor: this.colorCache[subInfo.gifterUserId],
				})
			})

			this.chatClient.onSubGift((channel, recipient, subInfo) => {
				const user = subInfo.gifter
				const previousGiftCount = giftCounts.get(user) || 0
				if (previousGiftCount > 0) {
					giftCounts.set(user, previousGiftCount - 1)
				} else {
					this.triggers.giftedSub({
						subs: 1,
						user: subInfo.gifterDisplayName,
						userId: subInfo.gifterUserId,
						userColor: this.colorCache[subInfo.gifterUserId],
					})
				}
			})
		},

		async setupEventSubTriggers() {
			this.eventSubClient = new EventSubWsListener({
				apiClient: this.channelTwitchClient,
			})

			//Trick to give a type hint to vscode.
			/** @type {EventSubWsListener} */
			const eventSubClient = this.eventSubClient
			/** @type { ApiClient } */
			const apiClient = this.channelTwitchClient

			this.followerCache = new Set()
			const followSub = eventSubClient.subscribeToChannelFollowEvents(
				this.state.channelId,
				async (event) => {
					if (this.followerCache.has(event.userId)) return

					this.followerCache.add(event.userId)

					this.logger.info(`followed by ${event.userDisplayName}`)
					this.triggers.follow({
						user: event.userDisplayName,
						userId: event.userId,
						...{ userColor: this.colorCache[event.userId] },
					})

					let follows =
						await this.channelTwitchClient.users.getFollows({
							followedUser: this.state.channelId,
						})
					this.state.followers = follows.total
					this.state.lastFollower =
						follows.data.length > 0
							? follows.data[0].userDisplayName
							: null
				}
			)

			//Initialize the state
			const hypeTrainResult =
				await apiClient.hypeTrain.getHypeTrainEventsForBroadcaster(
					this.state.channelId
				)
			const hypeTrainEvent = hypeTrainResult.data[0]
			if (hypeTrainEvent && hypeTrainEvent.expiryDate > new Date()) {
				//The hypetrain is active
				this.state.hypeTrainLevel = hypeTrainEvent.level
				this.state.hypeTrainGoal = hypeTrainEvent.goal
				this.state.hypeTrainProgress = 0 //Twitch API is broken here, it doesn't return the level progress when querying
				this.state.hypeTrainTotal = hypeTrainEvent.total
			}

			const trainBeginSub =
				eventSubClient.subscribeToChannelHypeTrainBeginEvents(
					this.state.channelId,
					(event) => {
						this.state.hypeTrainLevel = event.level
						this.state.hypeTrainProgress = event.progress
						this.state.hypeTrainGoal = event.goal
						this.state.hypeTrainTotal = event.total
						this.state.hypeTrainExists = true
						this.logger.info(`Hype Train Started`)

						this.triggers.hypeTrainStarted({
							level: event.level,
							progress: event.progress,
							goal: event.goal,
							total: event.total,
						})
					}
				)

			const trainProgressSub =
				eventSubClient.subscribeToChannelHypeTrainProgressEvents(
					this.state.channelId,
					(event) => {
						const levelUp = event.level > this.state.hypeTrainLevel

						this.state.hypeTrainLevel = event.level
						this.state.hypeTrainProgress = event.progress
						this.state.hypeTrainGoal = event.goal
						this.state.hypeTrainTotal = event.total

						this.logger.info(`Hype Train Progressed`)

						if (levelUp) {
							this.triggers.hypeTrainLevelUp({
								level: event.level,
								progress: event.progress,
								goal: event.goal,
								total: event.total,
							})
						}
					}
				)

			const trainEndSub =
				eventSubClient.subscribeToChannelHypeTrainEndEvents(
					this.state.channelId,
					(event) => {
						this.state.hypeTrainLevel = 0
						this.state.hypeTrainProgress = 0
						this.state.hypeTrainGoal = 0
						this.state.hypeTrainTotal = 0
						this.state.hypeTrainExists = false

						this.logger.info(`Hype Train Ended`)

						this.triggers.hypeTrainEnded({
							level: event.level,
							progress: event.progress,
							goal: event.goal,
							total: event.total,
						})
					}
				)

			const raidOutSub = eventSubClient.subscribeToChannelRaidEventsFrom(
				this.state.channelId,
				(event) => {
					this.logger.info(
						`Raided Out to ${event.raidedBroadcasterDisplayName}`
					)
					this.triggers.raidOut({
						raidedUser: event.raidedBroadcasterDisplayName,
						raidedUserId: event.raidedBroadcasterId,
						raiders: event.viewers,
					})
				}
			)

			//TODO: We need to update the state with the prediction progress, but that means reactive arrays.

			const predictionBeginSub =
				eventSubClient.subscribeToChannelPredictionBeginEvents(
					this.state.channelId,
					(event) => {
						this.logger.info(`Prediction Started`)

						this.state.predictionTitle = event.title
						this.state.predictionExists = true
						this.state.predictionOpen = true
						let total = 0
						for (let o of event.outcomes) {
							total += o.channelPoints
						}
						this.state.predictionTotal = total

						this.triggers.predictionStarted({
							title: event.title,
							outcomes: event.outcomes.map((o) => ({
								title: o.title,
								color: o.color,
								points: 0,
							})),
						})
					}
				)

			const predictionProgressSub =
				eventSubClient.subscribeToChannelPredictionProgressEvents(
					this.state.channelId,
					(event) => {
						//this.triggers.predictionVote({ title: event.title, outcomes: event.outcomes.map(o => ({ title: o.title, color: o.color, points: o.channelPoints })) })
						let total = 0
						for (let o of event.outcomes) {
							total += o.channelPoints
						}
						this.state.predictionTotal = total
					}
				)

			const predictionLockSub =
				eventSubClient.subscribeToChannelPredictionLockEvents(
					this.state.channelId,
					(event) => {
						this.logger.info(`Prediction Locked`)
						let total = 0
						for (let o of event.outcomes) {
							total += o.channelPoints
						}

						this.state.predictionOpen = false
						this.state.predictionPending = true
						this.state.predictionTitle = event.title

						this.triggers.predictionLocked({
							title: event.title,
							total,
							outcomes: event.outcomes.map((o) => ({
								title: o.title,
								color: o.color,
								points: o.channelPoints,
							})),
						})
					}
				)

			const predictionEndSub =
				eventSubClient.subscribeToChannelPredictionEndEvents(
					this.state.channelId,
					(event) => {
						this.logger.info(`Prediction Settled`)
						let total = 0
						for (let o of event.outcomes) {
							total += o.channelPoints
						}

						this.state.predictionTitle = null
						this.state.predictionPending = false
						this.state.predictionExists = false

						this.triggers.predictionSettled({
							title: event.title,
							total,
							winner: {
								title: event.winningOutcome.title,
								color: event.winningOutcome.color,
								points: event.winningOutcome.channelPoints,
							},
							outcomes: event.outcomes.map((o) => ({
								title: o.title,
								color: o.color,
								points: o.channelPoints,
							})),
						})
					}
				)

			////

			const pollBeginSub =
				eventSubClient.subscribeToChannelPollBeginEvents(
					this.state.channelId,
					(event) => {
						this.logger.info(`Poll Started`)

						const totalVotes = event.choices.reduce(
							(total, choice) => total + choice.totalVotes
						)
						const choices = event.choices.map((c) => ({
							title: c.title,
							votes: c.totalVotes,
							fraction: c.totalVotes / totalVotes,
						}))

						this.state.pollExists = true
						this.state.pollTitle = event.title

						this.triggers.pollStarted({
							title: event.title,
							choices,
							totalVotes,
						})
					}
				)

			/*eventSubClient.subscribeToChannelPollProgressEvents(this.state.channelId, (event) => {
				this.logger.info(`Poll Progressed`)
			})*/

			const pollEndSub = eventSubClient.subscribeToChannelPollEndEvents(
				this.state.channelId,
				(event) => {
					this.logger.info(`Poll Ended`)

					const totalVotes = event.choices.reduce(
						(total, choice) => total + choice.totalVotes
					)
					const choices = event.choices.map((c) => ({
						title: c.title,
						votes: c.totalVotes,
						fraction: c.totalVotes / totalVotes,
					}))
					const winner = _.maxBy(choices, (r) => r.votes)
					this.triggers.pollEnded({
						title: event.title,
						totalVotes,
						winner,
						choices,
					})

					this.state.pollExists = false
					this.state.pollTitle = null
				}
			)

			const subs = await Promise.all([
				followSub,
				trainBeginSub,
				trainProgressSub,
				trainEndSub,
				raidOutSub,
				predictionBeginSub,
				predictionProgressSub,
				predictionLockSub,
				predictionEndSub,
				pollBeginSub,
				pollEndSub,
			])

			await eventSubClient.start()
		},

		async setupPubSubTriggers() {
			this.basePubSubClient = new BasicPubSubClient()
			this.pubSubClient = new PubSubClient(this.basePubSubClient)
			await this.pubSubClient.registerUserListener(
				this.channelAuth,
				this.state.channelId
			)

			await this.pubSubClient.onBits(this.state.channelId, (message) => {
				this.logger.info(`Bits: ${message.bits}`)

				this.triggers.bits({
					bits: message.bits,
					user: message.userName,
					userId: message.userId,
					message: message.message,
					filteredMessage: this.filterMessage(message.message),
					userColor: this.colorCache[message.userId],
				})
			})

			await this.pubSubClient.onRedemption(
				this.state.channelId,
				(redemption) => {
					this.logger.info(
						`Redemption: ${redemption.rewardId} ${redemption.rewardTitle}`
					)
					let message = redemption.message
					if (!message) {
						message = ""
					}

					this.triggers.redemption({
						reward: redemption.rewardTitle,
						message,
						filteredMessage: this.filterMessage(message),
						user: redemption.userDisplayName,
						userId: redemption.userId,
						//...{ userColor: this.colorCache[redemption.userId] }
					})
				}
			)

			await this.pubSubClient.onSubscription(
				this.state.channelId,
				async (message) => {
					this.state.lastSubscriber = message.userDisplayName
					if (message.isGift) {
						return //Handle gifted subs elsewhere
					} else {
						let months = message.months ? message.months : 0
						this.logger.info(
							`Sub ${message.userDisplayName} : ${months}`
						)
						this.triggers.subscribe({
							months,
							user: message.userDisplayName,
							userId: message.userId,
							prime: message.subPlan == "Prime",
							userColor: this.colorCache[message.userId],
							message: message.message,
							filteredMessage: this.filterMessage(
								message.message
							),
						})
					}

					await this.querySubscribers()
				}
			)

			await this.pubSubClient.onCustomTopic(
				this.state.channelId,
				"video-playback-by-id",
				async (msg) => {
					this.state.viewers =
						"viewers" in msg.data ? msg.data.viewers : 0
					//console.log("video playback", msg.data);
				}
			)
		},

		async querySubscribers() {
			try {
				const subscribers =
					await this.channelTwitchClient.subscriptions.getSubscriptions(
						this.state.channelId
					)
				this.state.subscribers = subscribers.total
				//this.state.lastSubscriber = subscribers.data.length > 0 ? subscribers.data[0].userDisplayName : null
			} catch (err) {
				this.state.subscribers = 0
				console.error(err)
			}
		},

		async queryFollows() {
			try {
				let follows = await this.channelTwitchClient.users.getFollows({
					followedUser: this.state.channelId,
				})

				this.state.followers = follows.total
				this.state.lastFollower =
					follows.data.length > 0
						? follows.data[0].userDisplayName
						: null
			} catch (err) {
				this.logger.error(`Error Querying Follows ${err}`)
			}
		},

		async initConditions() {
			await this.querySubscribers()
			await this.queryFollows()
		},

		async initChannelRewards() {
			if (!this.state.isAffiliate) {
				this.logger.info(
					"Channel isn't affiliate, skipping channel rewards"
				)
				return
			}

			this.rewards = (
				await this.channelTwitchClient.channelPoints.getCustomRewards(
					this.state.channelId,
					true
				)
			).map((r) => ({
				id: r.id,
				title: r.title,
				backgroundColor: r.backgroundColor,
				prompt: r.prompt,
				cost: r.cost,
				userInputRequired: r.userInputRequired,
				autoFulfill: r.autoFulfill,
				maxRedemptionsPerStream: r.maxRedemptionsPerStream,
				maxRedemptionsPerUserPerStream:
					r.maxRedemptionsPerUserPerStream,
				isEnabled: r.isEnabled,
			}))
			this.logger.info(`Got rewards, ${this.rewards.length}`)
		},

		async switchChannelRewards(activeRewards, inactiveRewards) {
			if (!this.state.channelId || !this.state.isAffiliate) return

			//console.log("Switch Rewards")
			//console.log("Active", activeRewards)
			//console.log("Inactive", inactiveRewards)

			for (let reward of this.rewards) {
				//console.log("Reward: ", reward.title, ":", reward.isEnabled ,":", activeRewards.has(reward.title), inactiveRewards.has(reward.title))
				if (!reward.isEnabled && activeRewards.has(reward.title)) {
					await this.channelTwitchClient.channelPoints.updateCustomReward(
						this.state.channelId,
						reward.id,
						{ isPaused: false, isEnabled: true }
					)
					reward.isEnabled = true
				} else if (
					reward.isEnabled &&
					inactiveRewards.has(reward.title)
				) {
					await this.channelTwitchClient.channelPoints.updateCustomReward(
						this.state.channelId,
						reward.id,
						{ isPaused: false, isEnabled: false }
					)
					reward.isEnabled = false
				}
			}
		},
	},
	publicMethods: {
		getUserColor(userId) {
			return this.colorCache[userId]
		},
	},
	ipcMethods: {
		async getAuthStatus() {
			return {
				bot: this.botAuth ? this.state.botName : null,
				channel: this.channelAuth ? this.state.channelName : false,
			}
		},

		async doBotAuth() {
			let result = await this.botAuth.doAuth(true)
			if (result) {
				await this.completeAuth()
				return true
			}
			return false
		},

		async doChannelAuth() {
			let result = await this.channelAuth.doAuth(true)
			if (result) {
				await this.completeAuth()
				return true
			}
			return false
		},

		async searchCategories(query = "") {
			try {
				const categories =
					await this.channelTwitchClient.search.searchCategories(
						query
					)
				const pojoCategories = []

				for (let cat of categories.data) {
					pojoCategories.push({
						id: cat.id,
						name: cat.name,
						boxArtUrl: cat.boxArtUrl,
					})
				}

				return pojoCategories
			} catch (err) {
				console.error(err)
			}
		},

		async getCategoryById(id) {
			if (!this.channelTwitchClient) return null
			const category = await this.channelTwitchClient.games.getGameById(
				id
			)
			if (category) {
				const pojoCat = {
					name: category.name,
					id: category.id,
					boxArtUrl: category.boxArtUrl,
				}
				pojoCat.boxArtUrl = pojoCat.boxArtUrl.replace("{width}", "52")
				pojoCat.boxArtUrl = pojoCat.boxArtUrl.replace("{height}", "72")
				return pojoCat
			}
			return null
		},

		async updateStreamInfo(info) {
			await this.channelTwitchClient.channels.updateChannelInfo(
				this.state.channelId,
				{
					title: info.title,
					gameId: info.category,
					tags: info.tags,
				}
			)
		},

		getRewards() {
			return this.rewards.map((r) => ({
				id: r.id,
				title: r.title,
				backgroundColor: r.backgroundColor,
				prompt: r.prompt,
				cost: r.cost,
				userInputRequired: r.userInputRequired,
				autoFulfill: r.autoFulfill,
				maxRedemptionsPerStream: r.maxRedemptionsPerStream,
				maxRedemptionsPerUserPerStream:
					r.maxRedemptionsPerUserPerStream,
			}))
		},

		async createReward(rewardDef) {
			const reward =
				await this.channelTwitchClient.channelPoints.createCustomReward(
					this.state.channelId,
					{
						title: rewardDef.title,
						prompt: rewardDef.prompt,
						backgroundColor: rewardDef.backgroundColor,
						cost: rewardDef.cost,
						userInputRequired: !!rewardDef.userInputRequired,
						autoFulfill: !!rewardDef.autoFulfill,
						globalCooldown: rewardDef.globalCooldown || 0,
						maxRedemptionsPerStream:
							rewardDef.maxRedemptionsPerStream || null,
						maxRedemptionsPerUserPerStream:
							rewardDef.maxRedemptionsPerUserPerStream || null,
					}
				)

			this.rewards.push(reward)
		},

		async updateReward(rewardDef) {
			const idx = this.rewards.findIndex((r) => r.id == rewardDef.id)
			if (idx == -1) return false

			const reward =
				await this.channelTwitchClient.channelPoints.updateCustomReward(
					this.state.channelId,
					rewardDef.id,
					{
						title: rewardDef.title,
						prompt: rewardDef.prompt,
						backgroundColor: rewardDef.backgroundColor,
						cost: rewardDef.cost,
						userInputRequired: !!rewardDef.userInputRequired,
						autoFulfill: !!rewardDef.autoFulfill,
						globalCooldown: rewardDef.globalCooldown || 0,
						maxRedemptionsPerStream:
							rewardDef.maxRedemptionsPerStream || null,
						maxRedemptionsPerUserPerStream:
							rewardDef.maxRedemptionsPerUserPerStream || null,
					}
				)

			this.rewards[idx] = reward
		},

		async deleteReward(id) {
			const idx = this.rewards.findIndex((r) => r.id == id)
			await this.channelTwitchClient.channelPoints.deleteCustomReward(
				this.state.channelId,
				id
			)
			this.rewards.splice(idx, 1)
		},
	},
	async onProfileLoad(profile, config) {
		const redemptionTriggers = config
			? config.triggers
				? config.triggers.twitch
					? config.triggers.twitch.redemption
					: null
				: null
			: null
		profile.rewards = redemptionTriggers
			? redemptionTriggers.map((rt) => rt.config.reward)
			: []
	},
	async onProfilesChanged(activeProfiles, inactiveProfiles) {
		let activeRewards = new Set()
		let inactiveRewards = new Set()
		//Handle rewards
		for (let activeProf of activeProfiles) {
			for (let reward of activeProf.rewards) {
				activeRewards.add(reward)
			}
		}

		for (let inactiveProf of inactiveProfiles) {
			for (let reward of inactiveProf.rewards) {
				if (!activeRewards.has(reward)) {
					inactiveRewards.add(reward)
				}
			}
		}
		//Set all the reward states.
		await this.switchChannelRewards(activeRewards, inactiveRewards)
	},
	async onSettingsReload() {
		await this.shutdown()

		await this.doInitialAuth()
	},
	async onSecretsReload() {
		await this.shutdown()

		await this.doInitialAuth()
	},
	async onWebsocketConnected(socket) {
		socket.send(
			JSON.stringify({
				channel: {
					channelId: this.state.channelId,
					channelName: this.state.channelName,
				},
			})
		)
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
			description: "The active channel's Name",
		},
		channelId: {
			type: String,
			name: "Twitch Channel Name",
			description: "The active channel's ID",
		},
		channelProfileUrl: {
			type: String,
			name: "Twitch Channel Profile Picture URL",
		},
		botName: {
			type: String,
			name: "Bot Name",
			description: "The chat bot's Name",
		},
		botProfileUrl: {
			type: String,
			name: "Twitch Channel Profile Picture URL",
		},
		subscribers: {
			type: Number,
			name: "Number of Twitch Subscribers",
		},
		followers: {
			type: Number,
			name: "Number of Twitch Followers",
		},
		viewers: {
			type: Number,
			name: "Number of Twitch Viewers",
			default: 0,
		},
		isAuthed: {
			type: Boolean,
			name: "Is Authed",
			description: "True if the user is completely authenticated.",
			hidden: true,
		},
		isAffiliate: {
			type: Boolean,
			name: "Is Affiliate",
			description: "True if the user is at least affiliate",
			hidden: true,
		},
		hypeTrainExists: {
			type: Boolean,
			name: "Hype Train Exists",
			description: "True if there's currently a hype train.",
		},
		hypeTrainLevel: {
			type: Number,
			name: "Hype Train Level",
			description:
				"The Current Level of the hype train, if there's no hype train it is 0.",
		},
		hypeTrainGoal: {
			type: Number,
			name: "Hype Train Goal",
			description: "Points required for the next hype train level.",
		},
		hypeTrainProgress: {
			type: Number,
			name: "Hype Train Progress",
			description: "Points into the current level of the hype train",
		},
		hypeTrainTotal: {
			type: Number,
			name: "Hype Train Progress",
			description: "Total points across all levels of the type train.",
		},
		predictionExists: {
			type: Boolean,
			name: "Prediction Exists",
			description:
				"True if there's a prediction that's either open or waiting for the streamer to settle",
		},
		predictionOpen: {
			type: Boolean,
			name: "Prediction Open",
			description:
				"True if there's currently a prediction that viewers can add points to",
		},
		predictionPending: {
			type: Boolean,
			name: "Prediction Pending",
			description:
				"True if there's a locked prediction waiting to be settled by the streamer",
		},
		predictionTitle: {
			type: String,
			name: "Prediction Title",
			description: "The title of the current prediction",
		},
		predictionTotal: {
			type: Number,
			name: "Prediction Total",
			description: "Total points in the prediction",
		},
		pollExists: {
			type: Boolean,
			name: "Poll Exists",
			description: "True if there's a currently active poll",
		},
		pollTitle: {
			type: String,
			name: "Poll Title",
			description: "Title of the current poll.",
		},
		lastFollower: {
			type: String,
			name: "Last Follower",
			description: "Name of the person to follow",
		},
		lastSubscriber: {
			type: String,
			name: "Last Subscriber",
			description: "Name of the person to subscribe",
			serialized: true,
		},
		accessToken: {
			type: String,
			name: "Auth Token",
			description: "Super secret, treat like a password",
			hidden: true,
		},
		scopesChanged: {
			type: Boolean,
			name: "Helper for UI to know scopes have changed to prompt for re-signin",
			hidden: true,
		},
	},
	triggers: {
		chat: {
			name: "Chat Command",
			description: "Fires when any user chats.",
			config: {
				type: Object,
				properties: {
					command: {
						type: String,
						name: "Command",
						filter: true,
						template: true,
					},
					match: {
						type: String,
						enum: ["Start", "Anywhere", "Regex"],
						default: "Start",
						preview: false,
						name: "Match",
					},
					permissions: {
						type: Object,
						properties: {
							viewer: {
								type: Boolean,
								name: "Viewer",
								default: true,
								required: true,
							},
							sub: {
								type: Boolean,
								name: "Subscriber",
								default: true,
								required: true,
							},
							vip: {
								type: Boolean,
								name: "VIP",
								default: true,
								required: true,
							},
							mod: {
								type: Boolean,
								name: "Moderator",
								default: true,
								required: true,
							},
							streamer: {
								type: Boolean,
								name: "Streamer",
								default: true,
								required: true,
							},
						},
						preview: false,
					},
					cooldown: {
						type: Number,
						name: "Cooldown",
						preview: false,
						unit: { name: "Seconds", short: "s" },
					},
					users: {
						type: Array,
						name: "User List",
						items: { type: String },
					},
				},
			},
			context: {
				command: { type: String },
				user: { type: String },
				userId: { type: String },
				args: { type: Array },
				argString: { type: String },
				userColor: { type: String },
				message: { type: String },
				filteredMessage: { type: String },
				matches: { type: Array },
			},
			async handler(config, context, mapping, userInfo) {
				const command = config.command
					? await template(config.command, context)
					: ""
				let matches = doMatch(context.message, command, config.match)

				if (!matches) {
					return false
				}

				if (Array.isArray(matches)) {
					context.matches = matches //If we got an array back from doMatch it's a regexp match.
				}

				if (config.cooldown) {
					const now = Date.now()
					const last = this.commandTimes[mapping.id]
					if (now - last < config.cooldown * 1000) {
						return false
					}
					this.commandTimes[mapping.id] = now
				}

				if (config.users && config.users.length > 0) {
					console.log("Checking Users Context", context)

					const resolvedUserList = await Promise.all(
						config.users.map((u) => template(u, context))
					)

					if (!resolvedUserList.includes(context.user)) return false
				}

				if (config.permissions) {
					if (config.permissions.viewer) {
						return true
					}
					if (userInfo.isMod && config.permissions.mod) {
						return true
					}
					if (userInfo.isVip && config.permissions.vip) {
						return true
					}
					if (userInfo.isSubscriber && config.permissions.sub) {
						return true
					}
					if (userInfo.isBroadcaster && config.permissions.streamer) {
						return true
					}
				}

				return false
			},
		},
		redemption: {
			name: "Channel Points Redemption",
			description: "Fires for when a channel point reward is redeemed",
			config: {
				type: Object,
				properties: {
					reward: { type: "ChannelPointReward", filter: true },
				},
			},
			context: {
				reward: { type: String },
				user: { type: String },
				userId: { type: String },
				userColor: { type: String },
				message: { type: String },
				filteredMessage: { type: String },
			},
			handler(config, context) {
				return context.reward == config.reward
			},
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
			description:
				"Fires for when a user chats for the very first time in the channel.",
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
			description:
				"Fires for when a user subscribes. Based on total number of months subscribed.",
			config: {
				type: Object,
				properties: {
					months: {
						type: "Range",
						name: "Months Subbed",
						default: { min: 1 },
					},
				},
			},
			context: {
				months: { type: Number },
				user: { type: String },
				userId: { type: String },
				userColor: { type: String },
				prime: { type: Boolean },
				message: { type: String },
				filteredMessage: { type: String },
			},
			handler(config, context) {
				return inRange(context.months, config.months)
			},
		},
		giftedSub: {
			name: "Gifted Subscription",
			description:
				"Fires for when a user gifts subs. Based on the number of subs gifted..",
			config: {
				type: Object,
				properties: {
					subs: {
						type: "Range",
						name: "Subs Gifted",
						default: { min: 1 },
					},
				},
			},
			context: {
				subs: { type: Number },
				user: { type: String },
				userId: { type: String },
				userColor: { type: String },
			},
			handler(config, context) {
				return inRange(context.subs, config.subs)
			},
		},
		bits: {
			name: "Bits Cheered",
			description: "Fires for when a user cheers with bits",
			config: {
				type: Object,
				properties: {
					bits: {
						type: "Range",
						name: "Bits Cheered",
						default: { min: 1 },
					},
				},
			},
			context: {
				bits: { type: Number },
				user: { type: String },
				userId: { type: String },
				userColor: { type: String },
				message: { type: String },
				filteredMessage: { type: String },
			},
			handler(config, context) {
				return inRange(context.bits, config.bits)
			},
		},
		raid: {
			name: "Incoming Raid",
			description: "Fires when a raid start",
			config: {
				type: Object,
				properties: {
					raiders: {
						type: "Range",
						name: "Raiders",
						default: { min: 1 },
					},
				},
			},
			context: {
				raiders: { type: Number },
				user: { type: String },
				userId: { type: String },
				userColor: { type: String },
			},
			handler(config, context) {
				return inRange(context.raiders, config.raiders)
			},
		},
		raidOut: {
			name: "Outgoing Raid",
			description: "Fires when you raid someone else.",
			config: {
				type: Object,
				properties: {
					raiders: {
						type: "Range",
						name: "Raiders",
						default: { min: 1 },
					},
				},
			},
			context: {
				raiders: { type: Number },
				raidedUser: { type: String },
				raidedUserId: { type: String },
			},
			handler(config, context) {
				return inRange(context.raiders, config.raiders)
			},
		},
		ban: {
			name: "User Banned",
			description: "Fires when a user is banned",
			context: {
				user: { type: String },
			},
		},
		timeout: {
			name: "User Timed Out",
			description: "Fires when a user is timed out",
			context: {
				user: { type: String },
			},
		},
		hypeTrainStarted: {
			name: "Hype Train Started",
			description: "Fires when a hype train is first started",
			context: {
				level: { type: Number },
				progress: { type: Number },
				goal: { type: Number },
				total: { type: Number },
			},
		},
		hypeTrainLevelUp: {
			name: "Hype Train Level Up",
			description: "Fires when a hype train goes to the next level",
			config: {
				type: Object,
				properties: {
					level: {
						type: "Range",
						name: "Level",
						default: { min: 1 },
					},
				},
			},
			context: {
				level: { type: Number },
				progress: { type: Number },
				goal: { type: Number },
				total: { type: Number },
			},
			handler(config, context) {
				return inRange(context.level, config.level)
			},
		},
		hypeTrainEnded: {
			name: "Hype Train Ended",
			description: "Fires when a hype train ends",
			config: {
				type: Object,
				properties: {
					level: {
						type: "Range",
						name: "Level",
						default: { min: 1 },
					},
				},
			},
			context: {
				level: { type: Number },
				progress: { type: Number },
				goal: { type: Number },
				total: { type: Number },
			},
			handler(config, context) {
				return inRange(context.level, config.level)
			},
		},
		predictionStarted: {
			name: "Prediction Started",
			description: "Fires when a prediction is first opened to viewers",
			config: {
				type: Object,
				properties: {
					title: { type: String, name: "Title", template: true },
					match: {
						type: String,
						enum: ["Start", "Anywhere", "Regex"],
						default: "Start",
						preview: false,
						name: "Match",
					},
				},
			},
			context: {
				title: { type: String },
				outcomes: {
					type: Array,
					items: {
						type: Object,
						properties: {
							title: { type: String },
							color: { type: String },
							points: { type: Number },
						},
					},
				},
				matches: { type: Array, items: { type: String } },
			},
			async handler(context, config) {
				const title = config.title
					? await template(config.title, context)
					: ""
				let matches = doMatch(context.title, title, config.match)

				if (!matches) {
					return false
				}

				if (Array.isArray(matches)) {
					context.matches = matches //If we got an array back from doMatch it's a regexp match.
				}

				return true
			},
		},
		predictionLocked: {
			name: "Prediction Locked",
			description:
				"Fires when a prediction is locked and no more points can be added.",
			config: {
				type: Object,
				properties: {
					title: { type: String, name: "Title", template: true },
					match: {
						type: String,
						enum: ["Start", "Anywhere", "Regex"],
						default: "Start",
						preview: false,
						name: "Match",
					},
				},
			},
			context: {
				title: { type: String },
				outcomes: {
					type: Array,
					items: {
						type: Object,
						properties: {
							title: { type: String },
							color: { type: String },
							points: { type: Number },
						},
					},
				},
				total: { type: Number },
				matches: { type: Array, items: { type: String } },
			},
			async handler(context, config) {
				const title = config.title
					? await template(config.title, context)
					: ""
				let matches = doMatch(context.title, title, config.match)

				if (!matches) {
					return false
				}

				if (Array.isArray(matches)) {
					context.matches = matches //If we got an array back from doMatch it's a regexp match.
				}

				return true
			},
		},
		predictionSettled: {
			name: "Prediction Settled",
			description:
				"Fires when the streamer picks the winning outcome of the prediction",
			config: {
				type: Object,
				properties: {
					title: { type: String, name: "Title", template: true },
					match: {
						type: String,
						enum: ["Start", "Anywhere", "Regex"],
						default: "Start",
						preview: false,
						name: "Match",
					},
				},
			},
			context: {
				title: { type: String },
				outcomes: {
					type: Array,
					items: {
						type: Object,
						properties: {
							title: { type: String },
							color: { type: String },
							points: { type: Number },
						},
					},
				},
				total: { type: Number },
				winner: {
					type: Object,
					properties: {
						title: { type: String },
						color: { type: String },
						points: { type: Number },
					},
				},
				matches: { type: Array, items: { type: String } },
			},
			async handler(context, config) {
				const title = config.title
					? await template(config.title, context)
					: ""
				let matches = doMatch(context.title, title, config.match)

				if (!matches) {
					return false
				}

				if (Array.isArray(matches)) {
					context.matches = matches //If we got an array back from doMatch it's a regexp match.
				}

				return true
			},
		},
		pollStarted: {
			name: "Poll Started",
			description: "Fires when a poll opens up.",
			config: {
				type: Object,
				properties: {
					title: { type: String, name: "Title", template: true },
					match: {
						type: String,
						enum: ["Start", "Anywhere", "Regex"],
						default: "Start",
						preview: false,
						name: "Match",
					},
				},
			},
			context: {
				title: { type: String },
				totalVotes: { type: Number },
				choices: {
					type: Array,
					items: {
						type: Object,
						properties: {
							title: { type: String },
							votes: { type: Number },
							fraction: { type: Number },
						},
					},
				},
			},
			async handler(context, config) {
				const title = config.title
					? await template(config.title, context)
					: ""
				let matches = doMatch(context.title, title, config.match)

				if (!matches) {
					return false
				}

				if (Array.isArray(matches)) {
					context.matches = matches //If we got an array back from doMatch it's a regexp match.
				}

				return true
			},
		},
		pollEnded: {
			name: "Poll Ended",
			description: "Fires when a poll closes.",
			config: {
				type: Object,
				properties: {
					title: { type: String, name: "Title", template: true },
					match: {
						type: String,
						enum: ["Start", "Anywhere", "Regex"],
						default: "Start",
						preview: false,
						name: "Match",
					},
				},
			},
			context: {
				title: { type: String },
				totalVotes: { type: Number },
				winner: {
					type: Object,
					properties: {
						title: { type: String },
						votes: { type: Number },
						fraction: { type: Number },
					},
				},
				choices: {
					type: Array,
					items: {
						type: Object,
						properties: {
							title: { type: String },
							votes: { type: Number },
							fraction: { type: Number },
						},
					},
				},
			},
			async handler(context, config) {
				const title = config.title
					? await template(config.title, context)
					: ""
				let matches = doMatch(context.title, title, config.match)

				if (!matches) {
					return false
				}

				if (Array.isArray(matches)) {
					context.matches = matches //If we got an array back from doMatch it's a regexp match.
				}

				return true
			},
		},
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
				await this.chatClient.say(
					this.state.channelName.toLowerCase(),
					await template(message, context)
				)
			},
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
				await this.channelTwitchClient.channels.updateChannelInfo(
					this.state.channelId,
					{
						title: await template(message, context),
					}
				)
			},
		},
		runAd: {
			name: "Run Ad",
			description: "Run an ad",
			icon: "mdi-advertisements",
			color: "#5E5172",
			data: {
				type: String,
				enum: ["30 Seconds", "60 Seconds", "90 Seconds"],
			},
			async handler(duration) {
				const lookup = {
					"30 Seconds": 30,
					"60 Seconds": 60,
					"90 Seconds": 90,
				}
				await this.channelTwitchClient.channels.startChannelCommercial(
					this.state.channelId,
					lookup[duration]
				)
			},
		},
		streamMarker: {
			name: "Place Stream Marker",
			description:
				"Places a marker in the stream for use in the video editor",
			icon: "mdi-map-marker-star",
			color: "#5E5172",
			data: {
				type: String,
				template: true,
			},
			async handler(message, context) {
				await this.channelTwitchClient.streams.createStreamMarker(
					this.state.channelId,
					await template(message, context)
				)
			},
		},
		createClip: {
			name: "Create Clip",
			description:
				"Places a marker in the stream for use in the video editor",
			icon: "mdi-filmstrip",
			color: "#5E5172",
			data: {
				type: Object,
				properties: {},
			},
			async handler() {
				await this.channelTwitchClient.clips.createClip({
					channelId: this.state.channelId,
				})
			},
		},
		createPrediction: {
			name: "Create Prediction",
			description: "Creates a Twitch Prediction",
			icon: "mdi-crystal-ball",
			color: "#5E5172",
			data: {
				type: Object,
				properties: {
					title: {
						type: String,
						name: "Title",
						template: true,
					},
					duration: {
						type: Number,
						unit: { name: "Seconds", short: "s" },
						name: "Duration",
						template: true,
					},
					outcomes: {
						type: Array,
						name: "Outcomes",
						items: {
							type: String,
							template: true,
						},
					},
				},
			},
			async handler(predictionData, context) {
				const config = {
					title: await template(predictionData.title, context),
					autoLockAfter: Math.round(
						await templateNumber(predictionData.duration, context)
					),
					outcomes: await Promise.all(
						predictionData.outcomes.map((t) => template(t, context))
					),
				}

				await this.channelTwitchClient.predictions.createPrediction(
					this.state.channelId,
					config
				)
			},
		},
		createPoll: {
			name: "Create Poll",
			description: "Creates a Twitch Poll",
			icon: "mdi-poll",
			color: "#5E5172",
			data: {
				type: Object,
				properties: {
					title: {
						type: String,
						name: "Title",
						template: true,
					},
					duration: {
						type: Number,
						unit: { name: "Seconds", short: "s" },
						name: "Duration",
						template: true,
					},
					choices: {
						type: Array,
						name: "Outcomes",
						items: {
							type: String,
							template: true,
						},
					},
					channelPointsPerVote: {
						type: Number,
						name: "Channel Points Per Vote",
						template: true,
					},
				},
			},
			async handler(predictionData, context) {
				const config = {
					title: await template(predictionData.title, context),
					duration: await templateNumber(
						predictionData.duration,
						context
					),
					choices: await Promise.all(
						predictionData.choices.map((t) => template(t, context))
					),
					channelPointsPerVote: await templateNumber(
						predictionData.channelPointsPerVote,
						context
					),
				}

				await this.channelTwitchClient.polls.createPoll(
					this.state.channelId,
					config
				)
			},
		},
	},
	templateFunctions: {
		async followAge(userId) {
			const follow =
				await this.channelTwitchClient.users.getFollowFromUserToBroadcaster(
					userId,
					this.state.channelId
				)

			if (!follow) {
				return "Not Following"
			}

			const now = new Date()
			const diff = dateInterval(follow.followDate, now)

			let result = ""

			if (diff.years > 0) {
				result += ` ${diff.years} year${diff.years > 1 ? "s" : ""}`
			}

			if (diff.months > 0) {
				result += ` ${diff.months} month${diff.months > 1 ? "s" : ""}`
			}

			if (diff.days > 0) {
				result += ` ${diff.days} day${diff.days > 1 ? "s" : ""}`
			}

			if (diff.hours > 0) {
				result += ` ${diff.hours} hour${diff.hours > 1 ? "s" : ""}`
			}

			if (result.length == 0) {
				result = "Just Followed"
			}

			return result
		},
		async getStreamCategory(userId) {
			const channelInfo =
				await this.channelTwitchClient.channels.getChannelInfoById(
					userId
				)
			return channelInfo.gameName
		},
	},

	settingsView: "twitch",
}
