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

// SEE: https://github.com/DonorDrive/PublicAPI/tree/master
// SEE: https://github.com/breadweb/extralife-helper

interface DonorDriveIncentive {
	amount: number
	description: string
	incentiveImageUrl?: string
	quantity: number
	quantityClaimed: number
	links?: {
		[key: string]: string
	}
	incentiveId: string
	isActive: boolean
	startDate?: string
	endDate?: string
}

interface DonorDriveParticipant {
	displayName: string
	fundraisingGoal: number
	eventName: string
	links: {
		donate: string
		page: string
	}
	createdDateUTC: string
	eventId: number
	sumDonations: number
	participantId: number
	teamName: string
	avatarImageUrl: string
	teamId: number
	isTeamCaptain: boolean
	sumPledges: number
	numDonations: number
}

interface DonorDriveDonation {
	activityPledgeMaxAmount?: number
	activityPledgeUnitAmount?: number
	amount: number
	avatarImageURL: string
	createdDateUTC: string
	displayName: string
	donationID: string
	donorID: string
	donorIsRecipient?: boolean
	eventID: number
	incentiveID?: string
	isRegFee?: boolean
	links: Record<string, string>
	message: string
	participantID: number
	recipientName: string
	recipientImageURL: string
	teamID: number
}

interface DonorDriveMilestone {
	fundraisingGoal: number
	description: string
	milestoneId: string
	isActive: boolean
	isComplete: boolean
}

interface DonorDriveActivityBase {
	message: string
	title: string
	imageUrl: string
	createdDateUTC: string
}

interface DonorDriveDonationActivity extends DonorDriveActivityBase {
	amount: number
	isIncentive?: number
	type: "donation"
}

interface DonorDriveBadgeActivity extends DonorDriveActivityBase {
	type: "participantBadge"
}

type DonorDriveActivity = DonorDriveDonationActivity | DonorDriveBadgeActivity

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

		async function apiRequest<T extends object>(path: string, opts?: RequestInit) {
			const resp = await fetch(`${apiBase.value}${path}`, {
				...(opts ? opts : {}),
			})

			if (!resp.ok) {
				const text = await resp.text().catch(() => "")
				const errText = `HTTP Error ${resp.status}: ${text}`
				logger.error(errText)
				return undefined
			}

			return (await resp.json()) as T
		}

		let poller: NodeJS.Timer | undefined = undefined

		async function initialize() {
			if (poller) {
				//@ts-ignore
				clearInterval(poller)
			}

			if (!apiBase.value) return
			if (!participantId.value) return

			poller = setInterval(async () => {
				await pollForUpdates()
			}, 15 * 1000)
		}

		const eventName = defineState("eventName", { type: String, name: "Event Name" })
		const goal = defineState("goal", { type: Number, name: "Goal" })
		const totalRaised = defineState("totalRaised", { type: Number, name: "Total Raised" })
		const totalDonations = defineState("totalDonations", { type: Number, name: "Total Donations" })
		const donationCount = defineState("donationCount", { type: Number, name: "Donation Count" })
		const totalPledges = defineState("totalPledges", { type: Number, name: "Total Pledges" })

		const lastDonationId = defineState(
			"lastDonationId",
			{ type: String, required: true, default: "", view: false },
			true
		)

		function clearState() {
			eventName.value = undefined
			goal.value = undefined
			totalDonations.value = undefined
			totalRaised.value = undefined
			totalPledges.value = undefined
			donationCount.value = undefined
		}

		async function pollForUpdates() {
			const participant = await getParticipant()
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
				await handleNewDonations()
			}
		}

		async function handleNewDonations() {
			const donations = await apiRequest<DonorDriveDonation[]>(`/participants/${participantId.value}/donations`)
			if (!donations) return

			for (const donation of donations) {
				if (donation.donationID != lastDonationId.value) {
					//HANDLE THIS DONATION
				} else {
					break
				}
			}

			lastDonationId.value = donations[0].donationID
		}

		async function getParticipant() {
			if (!apiBase.value) return undefined
			if (!participantId.value) return undefined

			return await apiRequest<DonorDriveParticipant>(`/participants/${participantId.value}`)
		}

		const incentiveCache = new AsyncDictCache(getIncentives, "incentiveId")

		async function getIncentives(): Promise<DonorDriveIncentive[]> {
			if (!apiBase.value) return []
			if (!participantId.value) return []

			return (await apiRequest<DonorDriveIncentive[]>(`/participants/${participantId.value}/incentives`)) ?? []
		}

		onSettingChanged(apiBase, async () => {
			await initialize()
		})

		onSettingChanged(participantId, async () => {
			await initialize()
		})

		defineTrigger({
			id: "donation",
			name: "DonorDrive Donation",
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

		defineTrigger({
			id: "incentive",
			name: "DonorDrive Incentive",
			config: {
				type: Object,
				properties: {
					incentive: {
						type: String,
						enum: async () => {
							const incentives = await incentiveCache.values()
							return incentives.map((i) => ({
								name: i.description,
								value: i.incentiveId,
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
	}
)
