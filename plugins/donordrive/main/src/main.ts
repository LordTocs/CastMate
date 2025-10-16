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
} from "castmate-core"

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
		const apiBase = defineSetting("apiBase", {
			type: String,
			name: "API Base Url",
			default: "https://www.extra-life.org/api",
		})

		const participantId = defineSetting("participantId", {
			type: String,
			name: "Participant ID",
		})

		let poller: NodeJS.Timer | undefined = undefined

		async function initialize() {
			if (poller) {
				clearInterval(poller)
			}

			if (!apiBase.value) return
			if (!participantId.value) return
		}

		async function getParticipant() {
			if (!apiBase.value) return undefined
			if (!participantId.value) return undefined

			const resp = await fetch(`${apiBase.value}/participants/${participantId.value}`, {
				method: "get",
			})

			if (resp.ok) return undefined

			return (await resp.json()) as DonorDriveParticipant
		}

		async function getIncentives(): Promise<DonorDriveIncentive[]> {
			if (!apiBase.value) return []
			if (!participantId.value) return []

			const resp = await fetch(`${apiBase.value}/participants/${participantId.value}/incentives`, {
				method: "get",
			})

			if (!resp.ok) return []

			const result = (await resp.json()) as DonorDriveIncentive[]
			return result
		}

		onSettingChanged(apiBase, () => {})

		onSettingChanged(participantId, () => {})
	}
)
