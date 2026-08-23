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
	setupEntityPolling,
} from "./donordrive-api"
import assert from "node:assert"

function removeTrailingSlash(path: string) {
	if (path.endsWith("/") || path.endsWith("\\")) {
		return path.substring(0, path.length - 1)
	}
	return path
}

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

		const teamId = defineSetting("teamId", {
			type: String,
			name: "Team ID",
		})

		const participantEntityProvider: DonorDriveEntityProvider = () => {
			if (!apiBase.value) return undefined
			if (!participantId.value) return undefined

			return {
				type: "participants",
				id: participantId.value,
				apiBase: removeTrailingSlash(apiBase.value),
			}
		}

		const teamEntityProvider: DonorDriveEntityProvider = () => {
			if (!apiBase.value) return undefined
			if (!teamId.value) return undefined

			return {
				type: "teams",
				id: teamId.value,
				apiBase: removeTrailingSlash(apiBase.value),
			}
		}

		const eventName = defineState("eventName", { type: String, name: "Event Name" })
		const goal = defineState("goal", { type: Number, name: "Goal" })
		const totalRaised = defineState("totalRaised", { type: Number, name: "Total Raised" })
		const totalDonations = defineState("totalDonations", { type: Number, name: "Total Donations" })
		const donationCount = defineState("donationCount", { type: Number, name: "Donation Count" })
		const totalPledges = defineState("totalPledges", { type: Number, name: "Total Pledges" })

		const currentMilestone = defineState("currentMilestone", { type: String, name: "Current Milestone" })
		const currentMilestoneGoal = defineState("currentMilestoneGoal", {
			type: Number,
			name: "Current Milestone Goal",
		})
		const currentMilestoneStart = defineState("currentMilestoneStart", {
			type: Number,
			name: "Current Milestone Goal",
		})

		const teamEventName = defineState("teamEventName", { type: String, name: "Team Event Name" })
		const teamGoal = defineState("teamGoal", { type: Number, name: "Team Goal" })
		const teamTotalRaised = defineState("teamTotalRaised", { type: Number, name: "Team Total Raised" })
		const teamTotalDonations = defineState("teamTotalDonations", { type: Number, name: "Team Total Donations" })
		const teamDonationCount = defineState("teamDonationCount", { type: Number, name: "Team Donation Count" })
		const teamTotalPledges = defineState("teamTotalPledges", { type: Number, name: "Team Total Pledges" })

		const teamCurrentMilestone = defineState("teamCurrentMilestone", {
			type: String,
			name: "Team Current Milestone",
		})
		const teamCurrentMilestoneGoal = defineState("teamCurrentMilestoneGoal", {
			type: Number,
			name: "Team Current Milestone Goal",
		})
		const teamCurrentMilestoneStart = defineState("teamCurrentMilestoneStart", {
			type: Number,
			name: "Team Current Milestone Goal",
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
							const incentives = await participantPoller.incentiveCache.values()
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
							const milestones = await participantPoller.milestoneCache.values()
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

		const onTeamDonation = defineTrigger({
			id: "teamDonation",
			name: "DonorDrive Team Donation",
			icon: "mdi mdi-hand-coin",
			description: "Triggers when a donation is given to your Team on a DonorDrive campaign.",
			config: {
				type: Object,
				properties: {
					amount: { type: Range, name: "Amount" },
					incentive: { type: Boolean, name: "Run For Incentives", required: true, default: false },
					ignoreSelf: {
						type: Boolean,
						name: "Ignore Current Participant Donations",
						required: true,
						default: true,
					},
				},
			},
			context: {
				type: Object,
				properties: {
					isIncentive: { type: Boolean, required: true, view: false, default: false },
					participantId: { type: String, required: true, view: false },
					amount: { type: Number, name: "Amount", required: true, default: 10 },
					donor: { type: String, name: "Donor", required: true, default: "LordTocs" },
					donorAvatar: { type: String, name: "Avatar Image" },
					message: { type: String, name: "Message", default: "Here's a donation!" },
				},
			},
			async handle(config, context, mapping) {
				if (config.ignoreSelf && participantId.value == context.participantId) return false
				if (!Range.inRange(config.amount, context.amount)) return false
				if (context.isIncentive && !config.incentive) return false

				return true
			},
		})

		const onTeamIncentive = defineTrigger({
			id: "teamIncentive",
			name: "DonorDrive Team Incentive",
			icon: "mdi mdi-hand-coin",
			description: "Triggered when a donor drive team incentive is redeemed",
			config: {
				type: Object,
				properties: {
					incentive: {
						type: String,
						enum: async () => {
							const incentives = await teamPoller.incentiveCache.values()
							return incentives.map((i) => ({
								name: i.description,
								value: i.incentiveID,
							}))
						},
					},
					ignoreSelf: {
						type: Boolean,
						name: "Ignore Current Participant Donations",
						required: true,
						default: true,
					},
				},
			},
			context: {
				type: Object,
				properties: {
					incentiveId: { type: String, required: true, view: false },
					incentive: { type: String, required: true },
					participantId: { type: String, required: true, view: false },
					amount: { type: Number, name: "Amount", required: true, default: 10 },
					donor: { type: String, name: "Donor", required: true, default: "LordTocs" },
					donorAvatar: { type: String, name: "Avatar Image" },
					message: { type: String, name: "Message", default: "Here's a donation!" },
				},
			},
			async handle(config, context, mapping) {
				if (config.ignoreSelf && participantId.value == context.participantId) return false
				if (config.incentive == context.incentiveId) return true
				return false
			},
		})

		const onTeamMilestone = defineTrigger({
			id: "milestone",
			name: "DonorDrive Team Milestone",
			icon: "mdi mdi-hand-coin",
			description: "Triggered when a donor drive team milestone is met",
			config: {
				type: Object,
				properties: {
					milestone: {
						type: String,
						enum: async () => {
							const milestones = await teamPoller.milestoneCache.values()
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

		const participantPoller = setupEntityPolling(
			participantEntityProvider,
			{
				eventName,
				goal,
				totalRaised,
				totalDonations,
				totalPledges,
				donationCount,
				currentMilestone,
				currentMilestoneGoal,
				currentMilestoneStart,
			},
			{
				async onDonation(donation) {
					await onDonation({
						donor: donation.displayName ?? "Anonymous",
						isIncentive: donation.incentiveID != null,
						donorAvatar: donation.avatarImageURL,
						amount: donation.amount,
						message: donation.message ?? "",
					})
				},
				async onIncentive(donation, incentive) {
					await onIncentive({
						incentiveId: incentive.incentiveID,
						incentive: incentive.description,
						donor: donation.displayName ?? "Anonymous",
						donorAvatar: donation.avatarImageURL,
						amount: donation.amount,
						message: donation.message ?? "",
					})
				},
				async onMilestone(milestone) {
					await onMilestone({
						milestoneId: milestone.milestoneID,
						milestone: milestone.description,
						amount: milestone.fundraisingGoal,
					})
				},
			}
		)

		const teamPoller = setupEntityPolling(
			teamEntityProvider,
			{
				eventName: teamEventName,
				goal: teamGoal,
				totalRaised: teamTotalRaised,
				totalDonations: teamTotalDonations,
				totalPledges: teamTotalPledges,
				donationCount: teamDonationCount,
				currentMilestone: teamCurrentMilestone,
				currentMilestoneGoal: teamCurrentMilestoneGoal,
				currentMilestoneStart: teamCurrentMilestoneStart,
			},
			{
				async onDonation(donation) {
					await onTeamDonation({
						donor: donation.displayName ?? "Anonymous",
						isIncentive: donation.incentiveID != null,
						participantId: String(donation.participantID),
						donorAvatar: donation.avatarImageURL,
						amount: donation.amount,
						message: donation.message ?? "",
					})
				},
				async onIncentive(donation, incentive) {
					await onTeamIncentive({
						incentiveId: incentive.incentiveID,
						incentive: incentive.description,
						participantId: String(donation.participantID),
						donor: donation.displayName ?? "Anonymous",
						donorAvatar: donation.avatarImageURL,
						amount: donation.amount,
						message: donation.message ?? "",
					})
				},
				async onMilestone(milestone) {
					await onTeamMilestone({
						milestoneId: milestone.milestoneID,
						milestone: milestone.description,
						amount: milestone.fundraisingGoal,
					})
				},
			}
		)

		onSettingChanged(apiBase, async () => {
			initializeParticipant()
			initializeTeam()
		})

		onSettingChanged(participantId, async () => {
			initializeParticipant()
		})

		onSettingChanged(teamId, async () => {
			initializeTeam()
		})

		onLoad(async () => {
			initializeParticipant()
			initializeTeam()
		})

		function initializeParticipant() {
			participantPoller.reset()
			participantPoller.start()
		}

		function initializeTeam() {
			teamPoller.reset()
			teamPoller.start()
		}
	}
)
