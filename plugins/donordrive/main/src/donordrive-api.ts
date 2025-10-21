import { usePluginLogger } from "castmate-core"
import querystring from "node:querystring"
import { clearInterval } from "node:timers"

// SEE: https://github.com/DonorDrive/PublicAPI/tree/master
// SEE: https://github.com/breadweb/extralife-helper - NVM outdated
// SEE: https://github.com/DonorDrive/StreamKit/blob/master/donation-ticker.html

export interface DonorDriveIncentive {
	amount: number
	description: string
	incentiveImageUrl?: string
	quantity: number
	quantityClaimed: number
	links?: {
		[key: string]: string
	}
	incentiveID: string
	isActive: boolean
	startDate?: string
	endDate?: string
}

export interface DonorDriveParticipant {
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

interface ETagPollNoChange {
	type: "no-change"
}

interface ETagPollChanged<T> {
	type: "changed"
	etag: string
	data: T
}

export type ETagPollResult<T> = ETagPollNoChange | ETagPollChanged<T>

export interface DonorDriveEntity {
	type: "participants" | "teams"
	id: string
	apiBase: string
}

export type DonorDriveEntityProvider = () => DonorDriveEntity | undefined

export interface DonorDriveDonation {
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

export interface DonorDriveMilestone {
	fundraisingGoal: number
	description: string
	milestoneID: string
	isActive: boolean
	isComplete?: boolean
	endDateUTC?: string
	startDateUTC?: string
}

const logger = usePluginLogger("donordrive")

async function apiRequest<T extends object>(
	entityProvider: DonorDriveEntityProvider,
	path: string,
	opts?: RequestInit,
	query?: Record<string, any>
) {
	const entity = entityProvider()
	if (!entity) return undefined

	const qs = querystring.stringify(query)
	const url = `${entity.apiBase}/${entity.type}/${entity.id}${path}?${qs}`
	const resp = await fetch(url, {
		...(opts ? opts : {}),
	})

	if (!resp.ok) {
		const text = await resp.text().catch(() => "")
		const errText = `HTTP Error ${url} ${resp.status}: ${text}`
		logger.error(errText)
		return undefined
	}

	const data = (await resp.json()) as T

	logger.log("API Data", url, data)

	return data
}

async function pollApi<T>(
	entityProvider: DonorDriveEntityProvider,
	path: string,
	etag: string | undefined,
	opts?: RequestInit,
	query?: Record<string, any>
): Promise<ETagPollResult<T> | undefined> {
	const entity = entityProvider()
	if (!entity) return undefined

	const qs = querystring.stringify(query)
	const url = `${entity.apiBase}/${entity.type}/${entity.id}${path}?${qs}`
	const resp = await fetch(url, {
		...opts,
		headers: {
			"If-None-Match": etag ?? "",
		},
	})

	if (resp.status == 304) {
		logger.log(`Polled DonorDrive ${url} No Change (${etag})`)
		return {
			type: "no-change",
		}
	}

	const newEtag = resp.headers.get("etag") ?? ""

	if (!resp.ok) {
		const text = await resp.text().catch(() => "")
		const errText = `HTTP Error ${url} ${resp.status}: ${text}`
		logger.error(errText)
		return undefined
	}

	const data = await resp.json()
	logger.log("DonorDrive Data Received", url, newEtag, data)

	return {
		type: "changed",
		etag: newEtag,
		data,
	}
}

class DonorDriveIntervalPoller<T> {
	private etag: string | undefined = undefined
	private timer: NodeJS.Timeout | undefined = undefined
	private dataStorage: T | undefined

	get data() {
		return this.dataStorage
	}

	constructor(
		private entityProvider: DonorDriveEntityProvider,
		private path: string,
		private onChange: (data: T | undefined) => any,
		private interval: number = 15
	) {}

	private async pollInternal() {
		const result = await pollApi<T>(this.entityProvider, this.path, this.etag)

		if (!result) {
			await this.onChange(undefined)
			return
		}

		if (result.type == "changed") {
			this.etag = result.etag
			this.dataStorage = result.data

			await this.onChange(this.data)
		}
	}

	async poll() {
		await this.pollInternal()
	}

	async start() {
		this.stop()

		await this.poll()
		this.timer = setInterval(() => {
			this.poll()
		}, this.interval * 1000)
	}

	stop() {
		if (this.timer) {
			clearInterval(this.timer)
			this.timer = undefined
		}
	}

	reset() {
		this.stop()
		this.etag = undefined
	}
}

export function createEntityPoller(
	entityProvider: DonorDriveEntityProvider,
	onChange: (data: DonorDriveParticipant | undefined) => any
) {
	return new DonorDriveIntervalPoller<DonorDriveParticipant>(entityProvider, "", onChange, 15)
}

type DonorDriveDictCacheChangeEvent<T extends object, TK> = (oldCache: Map<TK, T>, newCache: Map<TK, T>) => any

type DonorDriveDictCacheChange<T extends object, TK> =
	| {
			type: "no-change"
	  }
	| {
			type: "changed"
			old: Map<TK, T> | undefined
			new: Map<TK, T> | undefined
	  }

export class DonorDriveDictCache<T extends object, K extends keyof T> {
	private lastCacheTime: number | undefined = undefined
	private etag: string | undefined
	private data: Map<T[K], T> = new Map()
	private fetchPromise: Promise<DonorDriveDictCacheChange<T, T[K]> | undefined> | undefined = undefined

	constructor(
		private entityProvider: DonorDriveEntityProvider,
		private path: string,
		private key: K,
		private cacheTime = 15
	) {}

	private async fetchInternal(): Promise<DonorDriveDictCacheChange<T, T[K]> | undefined> {
		try {
			const result = await pollApi<T[]>(this.entityProvider, this.path, this.etag)

			if (!result) return undefined

			if (result.type == "no-change") {
				return { type: "no-change" }
			}

			const old = this.data

			this.data = new Map()
			for (const obj of result.data) {
				this.data.set(obj[this.key], obj)
			}
			this.etag = result.etag
			this.lastCacheTime = Date.now()
			return { type: "changed", old, new: this.data }
		} catch (err) {
			return undefined
		}
	}

	async fetch() {
		if (this.fetchPromise) await this.fetchPromise
		else {
			this.fetchPromise = this.fetchInternal()
			const result = await this.fetchPromise
			this.fetchPromise = undefined
			return result
		}
	}

	get isOutOfDate() {
		return !this.data || Date.now() - (this.lastCacheTime ?? 0) > this.cacheTime * 1000
	}

	async get(key: T[K]) {
		if (this.isOutOfDate || !this.data.has(key)) {
			await this.fetch()
		}
		return this.data.get(key)
	}

	async values() {
		if (this.isOutOfDate) {
			await this.fetch()
		}
		return [...this.data.values()]
	}

	clear() {
		this.data.clear()
		this.lastCacheTime = undefined
		this.etag = undefined
	}
}

export function createIncentiveCache(entityProvider: DonorDriveEntityProvider) {
	return new DonorDriveDictCache<DonorDriveIncentive, "incentiveID">(entityProvider, "/incentives", "incentiveID", 60)
}

export function createMilestoneCache(entityProvider: DonorDriveEntityProvider) {
	return new DonorDriveDictCache<DonorDriveMilestone, "milestoneID">(entityProvider, "/milestones", "milestoneID", 60)
}

export async function queryDonations(entityProvider: DonorDriveEntityProvider, lastPollTime?: Date) {
	const result = await apiRequest<DonorDriveDonation[]>(
		entityProvider,
		"/donations",
		{},
		{
			where: `createdDateUTC > ${lastPollTime?.toISOString()}`,
			orderBy: "createdDateUTC ASC",
		}
	)

	return result
}
