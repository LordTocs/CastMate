import {
	AnyAction,
	InstantAction,
	MaybePromise,
	OffsetActions,
	Sequence,
	TimeAction,
	Toggle,
	isTimeAction,
	parseTemplateString,
} from "castmate-schema"
import { PluginManager, usePluginLogger } from "castmate-core"
import { nanoid } from "nanoid/non-secure"
import { LightColor } from "castmate-plugin-iot-shared"
import { TwitchViewer, TwitchViewerUnresolved } from "castmate-plugin-twitch-shared"
import { defaultStringIsTemplate } from "castmate-ui-core"
import { ChannelPointReward, TwitchAccount } from "castmate-plugin-twitch-main"

/**
 * Migrates from 0.4 to 0.5
 */

/**
 *
 */
interface OldAction {
	plugin: string
	action: string
	data: any
}

interface OldAutomation {
	description: string
	actions: OldAction[]
}

interface OldTrigger {
	config: any
	automation: OldAutomation
	id: string
}

interface OldProfile {
	version: string
	triggers: Record<string, Record<string, OldTrigger[]>>
	activationMode: Toggle
}

interface ActionMigrator {
	plugin: string
	action: string
	migrateConfig(oldConfig: any): MaybePromise<any>
}

const actionMigrators: Record<string, Record<string, ActionMigrator>> = {}

function registerOldActionMigrator(oldPlugin: string, oldAction: string, migrator: ActionMigrator) {
	if (!(oldPlugin in actionMigrators)) {
		actionMigrators[oldPlugin] = {}
	}

	if (oldAction in actionMigrators[oldPlugin]) {
		throw new Error("Double migrator registered")
	}

	actionMigrators[oldPlugin][oldAction] = migrator
}

const actionOverrides: Record<string, Record<string, { plugin: string; action: string }>> = {
	castmate: {
		delay: { plugin: "time", action: "delay" },
	},
	twitch: {},
}

function migrateTemplateStr<T>(template: T | string | undefined) {
	return template
}

///TWITCH MIGRATORS

registerOldActionMigrator("twitch", "sendChat", {
	plugin: "twitch",
	action: "chat",
	migrateConfig(oldConfig: string | undefined) {
		return {
			message: migrateTemplateStr(oldConfig),
		}
	},
})

//TODO: Whisper

registerOldActionMigrator("twitch", "sendAnnoucement", {
	plugin: "twitch",
	action: "annoucement",
	migrateConfig(oldConfig: { message: string; color: string }) {
		return {
			message: migrateTemplateStr(oldConfig.message),
			color: oldConfig.color,
		}
	},
})

registerOldActionMigrator("twitch", "sendShoutout", {
	plugin: "twitch",
	action: "shoutout",
	async migrateConfig(oldConfig: { user: string | undefined }) {
		return {
			streamer: await migrateTwitchUser(oldConfig.user),
		}
	},
})

registerOldActionMigrator("twitch", "runAd", {
	plugin: "twitch",
	action: "runAd",
	migrateConfig(oldConfig: "30 Seconds" | "60 Seconds" | "90 Seconds") {
		let duration = 30
		if (oldConfig == "60 Seconds") {
			duration = 60
		} else if (oldConfig == "90 Seconds") {
			duration = 90
		}

		return {
			duration,
		}
	},
})

registerOldActionMigrator("twitch", "streamMarker", {
	plugin: "twitch",
	action: "streamMarker",
	migrateConfig(oldConfig: string | undefined) {
		return {
			markerName: migrateTemplateStr(oldConfig),
		}
	},
})

registerOldActionMigrator("twitch", "createClip", {
	plugin: "twitch",
	action: "createClip",
	migrateConfig(oldConfig) {
		return {}
	},
})

registerOldActionMigrator("twitch", "createPrediction", {
	plugin: "twitch",
	action: "createPrediction",
	migrateConfig(oldConfig: { title: string | undefined; duration: number | string | undefined; outcomes: string[] }) {
		return {
			title: migrateTemplateStr(oldConfig.title),
			duration: migrateTemplateStr(oldConfig.duration),
			outcomes: oldConfig.outcomes.map((o) => migrateTemplateStr(o)),
		}
	},
})

registerOldActionMigrator("twitch", "createPoll", {
	plugin: "twitch",
	action: "createPoll",
	migrateConfig(oldConfig: { title: string | undefined; duration: number | string | undefined; choices: string[] }) {
		return {
			title: migrateTemplateStr(oldConfig.title),
			duration: migrateTemplateStr(oldConfig.duration),
			choices: oldConfig.choices.map((c) => migrateTemplateStr(c)),
		}
	},
})

registerOldActionMigrator("twitch", "timeout", {
	plugin: "twitch",
	action: "timeout",
	async migrateConfig(oldConfig: {
		user: string | undefined
		duration: number | string | undefined
		reason: string | undefined
	}) {
		return {
			viewer: await migrateTwitchUser(oldConfig.user),
			duration: migrateTemplateStr(oldConfig.duration) ?? 15,
			reason: migrateTemplateStr(oldConfig.reason),
		}
	},
})

registerOldActionMigrator("twitch", "ban", {
	plugin: "twitch",
	action: "ban",
	async migrateConfig(oldConfig: { user: string | undefined; reason: string | undefined }) {
		return {
			viewer: await migrateTwitchUser(oldConfig.user),
			reason: migrateTemplateStr(oldConfig.reason),
		}
	},
})

const logger = usePluginLogger("migrate")

function migrateOldLightColor(hbsk: {
	hue?: number | string
	sat?: number | string
	bri?: number | string
	temp?: number
	mode: "color" | "temp"
}): LightColor {
	if (hbsk.mode == "color") {
		return `hsb(${hbsk.hue ?? 0}, ${hbsk.sat ?? 0}, ${hbsk.bri ?? 0})` as LightColor
	} else {
		return `kb(${hbsk.temp ?? 0}, ${hbsk.bri ?? 0})` as LightColor
	}
}

function renameTemplateVar(templateStr: string, oldName: string, newName: string) {
	const parsed = parseTemplateString(templateStr)

	let output = ""

	for (const s of parsed.regions) {
		if (s.type == "string") {
			output += parsed.fullString.substring(s.startIndex, s.endIndex)
		} else {
			const str = parsed.fullString.substring(s.startIndex, s.endIndex)
			str.replace(`\\b${oldName}\\b`, newName)
			output += str
		}
	}

	return output
}

async function migrateTwitchUser(
	user: string | undefined,
	userVarName?: string
): Promise<TwitchViewerUnresolved | undefined> {
	if (user == null) return undefined

	if (defaultStringIsTemplate(user)) {
		return renameTemplateVar(user, "user", userVarName ?? "viewer") as TwitchViewerUnresolved
	}

	//TODO: LOOKUP ID
	return undefined
}

function migrateTwitchChannelPointReward(rewardName: string | undefined) {
	if (rewardName == null) return undefined

	for (const r of ChannelPointReward.storage) {
		if (r.config.name == rewardName) {
			return r.id
		}
	}

	return undefined
}

function migrateIotId(iotId: string | undefined) {
	if (iotId == null) return undefined

	const [provider, id] = iotId.split(".", 2)

	const providerMap: Record<string, string> = {
		hue: "philips-hue",
		tplink: "kasa",
		twinkly: "twinkly",
		wyze: "wyze",
		elgato: "elgato",
		govee: "govee",
		lifx: "lifx",
	}

	if (!id) return iotId

	return `${providerMap[provider] ?? provider}.${id}`
}

async function migrateActionConfig(oldAction: OldAction) {
	return {}
}

interface TimedMigrationStackItem {
	action: TimeAction
	offset: number
	duration: number
}

interface SequenceStackItem {
	sequence: Sequence
	offset: number
	timeOp?: TimedMigrationStackItem
}

async function migrateOldAutomation(oldAutomation: OldAutomation): Promise<Sequence> {
	let oldOffsetTime = 0

	const result: Sequence = {
		actions: [],
	}

	const seqStack: SequenceStackItem[] = [{ sequence: result, offset: 0 }]

	function canFit(pushSeq: SequenceStackItem) {
		if (oldOffsetTime == pushSeq.offset) return "append"
		if (pushSeq.timeOp) {
			if (
				oldOffsetTime >= pushSeq.timeOp.offset &&
				oldOffsetTime < pushSeq.timeOp.offset + pushSeq.timeOp.duration
			) {
				return "time-offset"
			}
		}
		return false
	}

	function pushAction(action: AnyAction, duration: number | undefined) {
		//Resolve time
		let pushSeq = seqStack[seqStack.length - 1]
		while (canFit(pushSeq) == false && seqStack.length > 1) {
			seqStack.pop()
			pushSeq = seqStack[seqStack.length - 1]
		}

		const fit = canFit(pushSeq)

		if (fit == "append") {
			//Do nothing appending is down there
		} else if (fit == "time-offset") {
			if (!pushSeq.timeOp) throw new Error("AHHHH")

			const offsetTime = oldOffsetTime - pushSeq.timeOp.offset

			const newSeq: OffsetActions = {
				id: nanoid(),
				offset: offsetTime,
				actions: [],
			}

			pushSeq.timeOp.action.offsets.push(newSeq)
			pushSeq = {
				sequence: newSeq,
				offset: oldOffsetTime,
			}
			seqStack.push(pushSeq)
		} else {
			//If we get here, we need to add padding delay
			const delayTime = oldOffsetTime - pushSeq.offset
			pushSeq.sequence.actions.push({
				id: nanoid(),
				plugin: "time",
				action: "delay",
				config: {
					duration: delayTime,
				},
			})

			pushSeq.offset += delayTime
		}

		if (duration == null) {
			pushSeq.sequence.actions.push(action)
		} else {
			pushSeq.sequence.actions.push(action)
			pushSeq.offset += duration
		}
	}

	for (const oldAction of oldAutomation.actions) {
		if (oldAction.plugin == "castmate") {
			if (oldAction.action == "timestamp") {
				oldOffsetTime = Math.max(oldOffsetTime, oldAction.data as number)
				continue
			} else {
				oldOffsetTime += Math.max(0, oldAction.data as number)
				continue
			}
		}

		const pluginKey = actionOverrides[oldAction.plugin]?.[oldAction.action]?.plugin ?? oldAction.plugin
		const actionKey = actionOverrides[oldAction.plugin]?.[oldAction.action]?.plugin ?? oldAction.action

		const action = PluginManager.getInstance().getAction(pluginKey, actionKey)

		if (!action) {
			logger.error("Missing Migration Action", pluginKey, actionKey)
			continue
		}

		const newConfig = await migrateActionConfig(oldAction)

		const duration = await action?.getDuration(newConfig)

		if (duration == null) {
			//Stack up on the previous offset
			const action: InstantAction = {
				id: nanoid(),
				plugin: pluginKey,
				action: actionKey,
				config: newConfig,
			}

			pushAction(action, duration)
		} else {
			//New is timed
			const action: TimeAction = {
				id: nanoid(),
				plugin: pluginKey,
				action: actionKey,
				config: newConfig,
				offsets: [],
			}

			pushAction(action, duration)
		}
	}

	return result
}
