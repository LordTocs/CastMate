import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	useSetting,
	getSettingValue,
	defineTransformTrigger,
	defineSetting,
	runOnChange,
	onSettingChanged,
	usePluginLogger,
	defineState,
	AsyncCache,
	AsyncDictCache,
} from "castmate-core"
import { Range } from "castmate-schema"
import querystring from "node:querystring"
import {
	createEntityPoller,
	createIncentiveCache,
	createMilestoneCache,
	DonorDriveDictCache,
	DonorDriveEntityProvider,
	DonorDriveIncentive,
	queryDonations,
} from "./donordrive-api"

export default definePlugin(
	{
		id: "donordrive",
		name: "Donor Drive",
		description: "",
		color: "#318BBC",
		icon: "mdi mdi-hand-coin",
	},
	() => {
		const logger = usePluginLogger()

		const apiBase = defineSetting("apiBase", {
			type: String,
			name: "API Base Url",
			default: "https://www.extra-life.org/api",
		})

		const participantId = defineSetting("participantId", {
			type: String,
			name: "Participant ID",
		})

		const entityProvider: DonorDriveEntityProvider = () => {
			if (!apiBase.value) return undefined
			if (!participantId.value) return undefined

			return {
				type: "participants",
				id: participantId.value,
				apiBase: apiBase.value,
			}
		}

		async function apiRequest<T extends object>(path: string, opts?: RequestInit, query?: Record<string, any>) {
			const qs = querystring.stringify(query)
			const resp = await fetch(`${apiBase.value}${path}?${qs}`, {
				...(opts ? opts : {}),
			})

			if (!resp.ok) {
				const text = await resp.text().catch(() => "")
				const errText = `HTTP Error ${resp.status}: ${text}`
				logger.error(errText)
				return undefined
			}

			logger.log("Request Etag", path, resp.headers.get("etag"))

			return (await resp.json()) as T
		}

		let poller: NodeJS.Timer | undefined = undefined

		async function initialize() {
			entityPoller.reset()

			if (!apiBase.value) return
			if (!participantId.value) return

			lastDonationTime = new Date()

			entityPoller.start()
		}

		const eventName = defineState("eventName", { type: String, name: "Event Name" })
		const goal = defineState("goal", { type: Number, name: "Goal" })
		const totalRaised = defineState("totalRaised", { type: Number, name: "Total Raised" })
		const totalDonations = defineState("totalDonations", { type: Number, name: "Total Donations" })
		const donationCount = defineState("donationCount", { type: Number, name: "Donation Count" })
		const totalPledges = defineState("totalPledges", { type: Number, name: "Total Pledges" })

		let currentMilestoneId: string | undefined = undefined
		const currentMilestone = defineState("currentMilestone", { type: String, name: "Current Milestone" })
		const currentMilestoneGoal = defineState("currentMilestoneGoal", {
			type: Number,
			name: "Current Milestone Goal",
		})
		const currentMilestoneStart = defineState("currentMilestoneStart", {
			type: Number,
			name: "Current Milestone Goal",
		})

		let lastDonationTime: Date = new Date()

		function clearState() {
			eventName.value = undefined
			goal.value = undefined
			totalDonations.value = undefined
			totalRaised.value = undefined
			totalPledges.value = undefined
			donationCount.value = undefined

			currentMilestoneId = undefined
			currentMilestone.value = undefined
			currentMilestoneGoal.value = undefined
			currentMilestoneStart.value = undefined

			incentiveCache.clear()
			milestoneCache.clear()
		}

		const entityPoller = createEntityPoller(entityProvider, async (participant) => {
			if (!participant) {
				clearState()
				return
			}

			const currentTotal = totalRaised.value
			const currentDonationCount = donationCount.value

			eventName.value = participant.eventName
			goal.value = participant.fundraisingGoal
			totalRaised.value = participant.sumDonations + participant.sumPledges
			totalPledges.value = participant.sumPledges
			totalDonations.value = participant.sumDonations

			donationCount.value = participant.numDonations

			if (currentDonationCount != donationCount.value) {
				//Force milestones to update so we have up to date milestone info
				await milestoneCache.fetch()
				//Received a donation
				await handleNewDonations(currentTotal)
			}

			await updateMilestones()
		})

		const milestoneCache = createMilestoneCache(entityProvider)

		async function updateMilestones() {
			const rawMilestones = await milestoneCache.values()
			const milestones = rawMilestones
				.filter((m) => m.isActive)
				.sort((a, b) => a.fundraisingGoal - b.fundraisingGoal)

			let found = false
			let lowerBound = 0
			for (const milestone of milestones) {
				if (!milestone.isActive) continue

				if (milestone.isComplete) {
					lowerBound = milestone.fundraisingGoal
				} else {
					currentMilestone.value = milestone.description
					currentMilestoneGoal.value = milestone.fundraisingGoal
					currentMilestoneStart.value = lowerBound
					found = true
					break
				}
			}

			if (!found) {
				currentMilestone.value = undefined
				currentMilestoneGoal.value = undefined
				currentMilestoneStart.value = undefined
			}
		}

		const incentiveCache = createIncentiveCache(entityProvider)

		async function handleNewDonations(prevTotal: number | undefined) {
			const lastDonationPollTime = lastDonationTime
			lastDonationTime = new Date()

			const donations = await queryDonations(entityProvider, lastDonationPollTime)
			if (!donations) return

			const rawMilestones = await milestoneCache.values()
			const milestones = rawMilestones
				.filter((m) => m.isActive)
				.sort((a, b) => a.fundraisingGoal - b.fundraisingGoal)

			let runningAmount = prevTotal

			//We gate donations on the last poll time, so any donations returned by this fetch are new!
			for (const donation of donations) {
				await onDonation({
					donor: donation.displayName ?? "Anonymous",
					isIncentive: donation.incentiveID != null,
					donorAvatar: donation.avatarImageURL,
					amount: donation.amount,
					message: donation.message ?? "",
				})

				if (donation.incentiveID) {
					const incentive = await incentiveCache.get(donation.incentiveID)

					if (incentive) {
						await onIncentive({
							incentiveId: donation.incentiveID,
							incentive: incentive.description,
							donor: donation.displayName ?? "Anonymous",
							donorAvatar: donation.avatarImageURL,
							amount: donation.amount,
							message: donation.message ?? "",
						})
					}
				}

				if (runningAmount != null) {
					const beforeAmount = runningAmount
					const afterAmount = runningAmount + donation.amount

					for (const milestone of milestones) {
						if (
							milestone.isComplete &&
							beforeAmount < milestone.fundraisingGoal &&
							afterAmount >= milestone.fundraisingGoal
						) {
							//This is the donation that crossed the milestones
							await onMilestone({
								milestoneId: milestone.milestoneID,
								milestone: milestone.description,
								amount: milestone.fundraisingGoal,
							})
						}
					}

					runningAmount = afterAmount
				}
			}
		}

		onSettingChanged(apiBase, async () => {
			await initialize()
		})

		onSettingChanged(participantId, async () => {
			await initialize()
		})

		onLoad(async () => {
			await initialize()
		})

		const onDonation = defineTrigger({
			id: "donation",
			name: "DonorDrive Donation",
			icon: "mdi mdi-hand-coin",
			description: "Triggers when a donation is given on a DonorDrive campaign.",
			config: {
				type: Object,
				properties: {
					amount: { type: Range, name: "Amount" },
					incentive: { type: Boolean, name: "Run For Incentives", required: true, default: false },
				},
			},
			context: {
				type: Object,
				properties: {
					isIncentive: { type: Boolean, required: true, view: false, default: false },
					amount: { type: Number, name: "Amount", required: true, default: 10 },
					donor: { type: String, name: "Donor", required: true, default: "LordTocs" },
					donorAvatar: { type: String, name: "Avatar Image" },
					message: { type: String, name: "Message", default: "Here's a donation!" },
				},
			},
			async handle(config, context, mapping) {
				if (!Range.inRange(config.amount, context.amount)) return false
				if (context.isIncentive && !config.incentive) return false

				return true
			},
		})

		const onIncentive = defineTrigger({
			id: "incentive",
			name: "DonorDrive Incentive",
			icon: "mdi mdi-hand-coin",
			description: "Triggered when a donor drive incentive is redeemed",
			config: {
				type: Object,
				properties: {
					incentive: {
						type: String,
						enum: async () => {
							const incentives = await incentiveCache.values()
							return incentives.map((i) => ({
								name: i.description,
								value: i.incentiveID,
							}))
						},
					},
				},
			},
			context: {
				type: Object,
				properties: {
					incentiveId: { type: String, required: true, view: false },
					incentive: { type: String, required: true },
					amount: { type: Number, name: "Amount", required: true, default: 10 },
					donor: { type: String, name: "Donor", required: true, default: "LordTocs" },
					donorAvatar: { type: String, name: "Avatar Image" },
					message: { type: String, name: "Message", default: "Here's a donation!" },
				},
			},
			async handle(config, context, mapping) {
				if (config.incentive == context.incentiveId) return true
				return false
			},
		})

		const onMilestone = defineTrigger({
			id: "milestone",
			name: "DonorDrive Milestone",
			icon: "mdi mdi-hand-coin",
			description: "Triggered when a donor drive milestone is met",
			config: {
				type: Object,
				properties: {
					milestone: {
						type: String,
						enum: async () => {
							const milestones = await milestoneCache.values()
							return milestones.map((i) => ({
								name: i.description,
								value: i.milestoneID,
							}))
						},
					},
				},
			},
			context: {
				type: Object,
				properties: {
					milestoneId: { type: String, required: true, view: false },
					milestone: { type: String, required: true },
					amount: { type: Number, name: "Amount", required: true, default: 10 },
				},
			},
			async handle(config, context, mapping) {
				if (config.milestone == context.milestoneId) return true
				return false
			},
		})
	}
)
