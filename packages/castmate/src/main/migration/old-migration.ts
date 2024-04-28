import {
	AnyAction,
	Command,
	CommandModeCommand,
	InstantAction,
	MaybePromise,
	OffsetActions,
	ProfileConfig,
	RegexModeCommand,
	Sequence,
	StringModeCommand,
	TimeAction,
	Toggle,
	TriggerData,
	createInlineAutomation,
	isTimeAction,
	parseTemplateString,
} from "castmate-schema"
import { Automation, PluginManager, Profile, ResourceRegistry, usePluginLogger } from "castmate-core"
import { nanoid } from "nanoid/non-secure"
import { LightColor } from "castmate-plugin-iot-shared"
import { TwitchViewer, TwitchViewerGroup, TwitchViewerUnresolved } from "castmate-plugin-twitch-shared"
import { ChannelPointReward, TwitchAccount } from "castmate-plugin-twitch-main"
import { OBSBoundsType, OBSSourceTransform } from "castmate-plugin-obs-shared"
import { SpellHook } from "castmate-plugin-spellcast-main"
import { OBSConnection } from "castmate-plugin-obs-main"

const logger = usePluginLogger("migrate")

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
	automation: OldAutomation | string
	id: string
}

interface OldProfile {
	version: string
	triggers: Record<string, Record<string, OldTrigger[]>>
	activationMode: Toggle
	onActivate?: OldAutomation | string
	onDeactivate?: OldAutomation | string
}

interface ActionMigrator {
	plugin: string
	action: string
	migrateConfig(oldConfig: any): MaybePromise<any>
}

function stringIsTemplate(value: any | string) {
	if (typeof value != "string") return false
	return value.includes("{{")
}

const actionMigrators: Record<string, Record<string, ActionMigrator>> = {}

function registerOldActionMigrator(oldPlugin: string, oldAction: string, migrator: ActionMigrator) {
	if (!(oldPlugin in actionMigrators)) {
		actionMigrators[oldPlugin] = {}
	}

	if (oldAction in actionMigrators[oldPlugin]) {
		throw new Error(`Double migrator registered, ${oldPlugin} ${oldAction} `)
	}

	actionMigrators[oldPlugin][oldAction] = migrator
}

interface TriggerMigrator {
	plugin: string
	trigger: string
	templateOverrides?: Record<string, string>
	migrateConfig(oldConfig: any): MaybePromise<any>
}

const triggerMigrators: Record<string, Record<string, TriggerMigrator>> = {}

function registerOldTriggerMigrator(oldPlugin: string, oldTrigger: string, migrator: TriggerMigrator) {
	if (!(oldPlugin in triggerMigrators)) {
		triggerMigrators[oldPlugin] = {}
	}

	if (oldTrigger in triggerMigrators[oldPlugin]) {
		throw new Error(`Double migrator registered, ${oldPlugin} ${oldTrigger} `)
	}

	triggerMigrators[oldPlugin][oldTrigger] = migrator
}

let templateVarOverrides: Record<string, string> = {}

function renameTemplateVar(templateStr: string, oldName: string, newName: string) {
	const parsed = parseTemplateString(templateStr)

	logger.log("Renaming", oldName, newName)

	let output = ""

	for (const s of parsed.regions) {
		if (s.type == "string") {
			output += parsed.fullString.substring(s.startIndex, s.endIndex)
		} else {
			let str = parsed.fullString.substring(s.startIndex, s.endIndex)
			str = str.replace(new RegExp(`\\b${oldName}\\b`), newName)
			output += str
		}
	}

	return output
}

function migrateTemplateStr<T>(templateStr: T | string | undefined) {
	if (typeof templateStr != "string") return templateStr

	const parsed = parseTemplateString(templateStr)

	let output = ""

	for (const s of parsed.regions) {
		if (s.type == "string") {
			output += parsed.fullString.substring(s.startIndex, s.endIndex)
		} else {
			let str = parsed.fullString.substring(s.startIndex, s.endIndex)

			for (let oldVar in templateVarOverrides) {
				//logger.log(`  Replacing Template ${oldVar} with ${templateVarOverrides[oldVar]}`)
				str = str.replace(new RegExp(`\\b${oldVar}\\b`), templateVarOverrides[oldVar])
			}

			output += str
		}
	}

	return output
}

function migrateResourceId(id: string | undefined) {
	return id
}

/////////MIGRATE BUILTIN//////////

function migrateAutomationId(oldAutomationName: string) {
	for (const auto of Automation.storage) {
		if (auto.config.name == oldAutomationName) {
			return auto.id
		}
	}

	return undefined
}

registerOldActionMigrator("castmate", "automation", {
	plugin: "castmate",
	action: "runAutomation",
	migrateConfig(oldConfig: { automation: string }) {
		return {
			automation: migrateAutomationId(oldConfig.automation), //TODO
		}
	},
})

////////MIGRATE TWITCH//////////////

async function migrateTwitchUser(user: string | undefined): Promise<TwitchViewerUnresolved | undefined> {
	return migrateTemplateStr(user)
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

///triggers

function migrateCommand(commandStr: string, matchStr: string): Command {
	if (matchStr == "Start" || matchStr == null) {
		const result: CommandModeCommand = {
			mode: "command",
			match: commandStr,
			arguments: [],
			hasMessage: false,
		}
		return result
	} else if (matchStr == "Anywhere") {
		const result: StringModeCommand = {
			mode: "string",
			match: commandStr,
			leftBoundary: false,
			rightBoundary: false,
		}
		return result
	} else if (matchStr == "Regex") {
		const result: RegexModeCommand = {
			mode: "regex",
			match: commandStr,
		}
		return result
	}
	throw new Error(`Error Migrating Command w/ Match String ${matchStr}`)
}

function migratePermissions(
	permissions: { viewer: boolean; sub: boolean; vip: boolean; mod: boolean; streamer: boolean } | undefined
) {
	if (permissions == null) {
		return TwitchViewerGroup.factoryCreate()
	}

	if (permissions.viewer) {
		return TwitchViewerGroup.factoryCreate()
	}

	return {
		rule: {
			or: [
				{
					properties: {
						subTier1: !!permissions.sub,
						subTier2: !!permissions.sub,
						subTier3: !!permissions.sub,
						vip: !!permissions.vip,
						mod: !!permissions.mod,
						broadcaster: !!permissions.streamer,
					},
				},
			],
		},
	} satisfies TwitchViewerGroup
}

registerOldTriggerMigrator("twitch", "chat", {
	plugin: "twitch",
	trigger: "chat",
	migrateConfig(oldConfig: {
		command: string
		match: string
		permissions: { viewer: boolean; sub: boolean; vip: boolean; mod: boolean; streamer: boolean }
		cooldown: number | undefined
		users: string[] | undefined
	}) {
		return {
			command: migrateCommand(oldConfig.command, oldConfig.match),
			cooldown: oldConfig.cooldown,
			group: migratePermissions(oldConfig.permissions),
		}
	},
})

registerOldTriggerMigrator("twitch", "redemption", {
	plugin: "twitch",
	trigger: "redemption",
	migrateConfig(oldConfig: { reward: string }) {
		return {
			reward: migrateTwitchChannelPointReward(oldConfig.reward),
			group: TwitchViewerGroup.factoryCreate(),
		}
	},
})

registerOldTriggerMigrator("twitch", "follow", {
	plugin: "twitch",
	trigger: "follow",
	migrateConfig(oldConfig) {
		return {
			group: TwitchViewerGroup.factoryCreate(),
		}
	},
})

registerOldTriggerMigrator("twitch", "firstTimeChat", {
	plugin: "twitch",
	trigger: "firstTimeChat",
	migrateConfig(oldConfig) {
		return {}
	},
})

registerOldTriggerMigrator("twitch", "subscribe", {
	plugin: "twitch",
	trigger: "subscription",
	migrateConfig(oldConfig: { months: Range }) {
		return {
			tier1: true,
			tier2: true,
			tier3: true,
			totalMonths: oldConfig.months,
			streakMonths: { min: 1 },
			group: TwitchViewerGroup.factoryCreate(),
		}
	},
})

registerOldTriggerMigrator("twitch", "giftedSub", {
	plugin: "twitch",
	trigger: "giftedSub",
	migrateConfig(oldConfig: { subs: Range }) {
		return {
			subs: oldConfig.subs,
			group: TwitchViewerGroup.factoryCreate(),
		}
	},
})

registerOldTriggerMigrator("twitch", "bits", {
	plugin: "twitch",
	trigger: "bits",
	migrateConfig(oldConfig: { bits: Range }) {
		return {
			bits: oldConfig.bits,
			group: TwitchViewerGroup.factoryCreate(),
		}
	},
})

registerOldTriggerMigrator("twitch", "raid", {
	plugin: "twitch",
	trigger: "raid",
	templateOverrides: {
		user: "raider",
	},
	migrateConfig(oldConfig: { raiders: Range }) {
		return {
			raiders: oldConfig.raiders,
			group: TwitchViewerGroup.factoryCreate(),
		}
	},
})

registerOldTriggerMigrator("twitch", "raidOut", {
	plugin: "twitch",
	trigger: "raidOut",
	templateOverrides: {
		user: "raidedStreamer",
	},
	migrateConfig(oldConfig: { raiders: Range }) {
		return {
			raiders: oldConfig.raiders,
			group: TwitchViewerGroup.factoryCreate(),
		}
	},
})

registerOldTriggerMigrator("twitch", "ban", {
	plugin: "twitch",
	trigger: "ban",
	migrateConfig(oldConfig) {
		return {
			group: TwitchViewerGroup.factoryCreate(),
		}
	},
})

registerOldTriggerMigrator("twitch", "timeout", {
	plugin: "twitch",
	trigger: "timeout",
	migrateConfig(oldConfig) {
		return {
			group: TwitchViewerGroup.factoryCreate(),
		}
	},
})

registerOldTriggerMigrator("twitch", "hypeTrainStarted", {
	plugin: "twitch",
	trigger: "hypeTrainStarted",
	migrateConfig(oldConfig) {
		return {}
	},
})

registerOldTriggerMigrator("twitch", "hypeTrainLevelUp", {
	plugin: "twitch",
	trigger: "hypeTrainLevelUp",
	migrateConfig(oldConfig: { level: Range }) {
		return {
			level: oldConfig.level,
		}
	},
})

registerOldTriggerMigrator("twitch", "hypeTrainEnded", {
	plugin: "twitch",
	trigger: "hypeTrainEnded",
	migrateConfig(oldConfig: { level: Range }) {
		return {
			level: oldConfig.level,
		}
	},
})

registerOldTriggerMigrator("twitch", "predictionStarted", {
	plugin: "twitch",
	trigger: "predictionStarted",
	migrateConfig(oldConfig: { title: string; match: "Start" | "Anywhere" | "Regex" }) {
		return {
			title: oldConfig.title,
		}
	},
})

registerOldTriggerMigrator("twitch", "predictionLocked", {
	plugin: "twitch",
	trigger: "predictionLocked",
	migrateConfig(oldConfig: { title: string; match: "Start" | "Anywhere" | "Regex" }) {
		return {
			title: oldConfig.title,
		}
	},
})

registerOldTriggerMigrator("twitch", "predictionSettled", {
	plugin: "twitch",
	trigger: "predictionSettled",
	migrateConfig(oldConfig: { title: string; match: "Start" | "Anywhere" | "Regex" }) {
		return {
			title: oldConfig.title,
		}
	},
})

registerOldTriggerMigrator("twitch", "pollStarted", {
	plugin: "twitch",
	trigger: "predictionSettled",
	migrateConfig(oldConfig: { title: string; match: "Start" | "Anywhere" | "Regex" }) {
		return {
			title: oldConfig.title,
		}
	},
})

registerOldTriggerMigrator("twitch", "pollEnded", {
	plugin: "twitch",
	trigger: "predictionSettled",
	migrateConfig(oldConfig: { title: string; match: "Start" | "Anywhere" | "Regex" }) {
		return {
			title: oldConfig.title,
		}
	},
})

registerOldTriggerMigrator("twitch", "shoutoutSent", {
	plugin: "twitch",
	trigger: "shoutoutSent",
	migrateConfig(oldConfig) {
		return {
			group: TwitchViewerGroup.factoryCreate(),
		}
	},
})

//TODO: Whisper
/// OBS ACTIONS

function getDefaultOBS() {
	const obsDefaultSetting = PluginManager.getInstance().getPlugin("obs")?.settings?.get("obsDefault")
	if (!obsDefaultSetting) return undefined
	if (obsDefaultSetting.type == "value") {
		return obsDefaultSetting.ref.value as OBSConnection
	}
	return undefined
}

function migrateDefaultOBS() {
	return getDefaultOBS()?.id
}

async function migrateOBSSource(sceneName: string, sourceName: string) {
	const obs = getDefaultOBS()

	if (!obs) return 0

	try {
		const result = await obs.connection.call("GetSceneItemId", {
			sceneName,
			sourceName,
		})

		return result.sceneItemId
	} catch (err) {
		return 0
	}
}

function migrateOldOBSTransform(
	oldTransform:
		| {
				position: { x: number; y: number } | undefined
				rotation: number | undefined
				scale: { x: number; y: number } | undefined
				crop: { top: number; right: number; bottom: number; left: number }
				boundingBox: { boxType: OBSBoundsType; alignment: number; width: number; height: number }
		  }
		| undefined
): OBSSourceTransform {
	if (!oldTransform) {
		return OBSSourceTransform.factoryCreate()
	}

	return {
		position: {
			x: migrateTemplateStr(oldTransform.position?.x),
			y: migrateTemplateStr(oldTransform.position?.y),
		},
		rotation: migrateTemplateStr(oldTransform.rotation),
		alignment: undefined,
		scale: {
			x: migrateTemplateStr(oldTransform.scale?.x),
			y: migrateTemplateStr(oldTransform.scale?.y),
		},
		crop: {
			top: migrateTemplateStr(oldTransform.crop?.top),
			bottom: migrateTemplateStr(oldTransform.crop?.bottom),
			left: migrateTemplateStr(oldTransform.crop?.left),
			right: migrateTemplateStr(oldTransform.crop?.right),
		},
		boundingBox: {
			boxType: oldTransform.boundingBox?.boxType,
			alignment: oldTransform.boundingBox?.alignment,
			width: migrateTemplateStr(oldTransform.boundingBox?.width),
			height: migrateTemplateStr(oldTransform.boundingBox?.height),
		},
	}
}

registerOldActionMigrator("obs", "scene", {
	plugin: "obs",
	action: "scene",
	migrateConfig(oldConfig: { scene: string }) {
		return {
			obs: migrateDefaultOBS(),
			scene: migrateTemplateStr(oldConfig.scene),
		}
	},
})

registerOldActionMigrator("obs", "prevScene", {
	plugin: "obs",
	action: "prevScene",
	migrateConfig(oldConfig) {
		return {
			obs: migrateDefaultOBS(),
		}
	},
})

registerOldActionMigrator("obs", "source", {
	plugin: "obs",
	action: "source",
	async migrateConfig(oldConfig: { scene: string; source: string; enabled: Toggle }) {
		return {
			obs: migrateDefaultOBS(),
			scene: migrateTemplateStr(oldConfig.scene),
			source: await migrateOBSSource(oldConfig.scene, oldConfig.source),
			enabled: oldConfig.enabled,
		}
	},
})

registerOldActionMigrator("obs", "filter", {
	plugin: "obs",
	action: "filter",
	async migrateConfig(oldConfig: { sourceName: string; filterName: string; filterEnabled: Toggle }) {
		return {
			obs: migrateDefaultOBS(),
			sourceName: migrateTemplateStr(oldConfig.sourceName),
			filterName: migrateTemplateStr(oldConfig.filterName),
			filterEnabled: oldConfig.filterEnabled,
		}
	},
})

registerOldActionMigrator("obs", "text", {
	plugin: "obs",
	action: "text",
	async migrateConfig(oldConfig: { text: string; sourceName: string }) {
		return {
			obs: migrateDefaultOBS(),
			sourceName: migrateTemplateStr(oldConfig.sourceName),
			text: migrateTemplateStr(oldConfig.text),
		}
	},
})

registerOldActionMigrator("obs", "mediaAction", {
	plugin: "obs",
	action: "mediaAction",
	migrateConfig(oldConfig: {
		mediaSource: string
		action: "Play" | "Pause" | "Restart" | "Stop" | "Next" | "Previous"
	}) {
		return {
			obs: migrateDefaultOBS(),
			source: migrateTemplateStr(oldConfig.mediaSource),
			action: oldConfig.action,
		}
	},
})

registerOldActionMigrator("obs", "changeVolume", {
	plugin: "obs",
	action: "changeVolume",
	migrateConfig(oldConfig: { sourceName: string; volume: number }) {
		return {
			obs: migrateDefaultOBS(),
			source: migrateTemplateStr(oldConfig.sourceName),
			volume: migrateTemplateStr(oldConfig.volume),
		}
	},
})

registerOldActionMigrator("obs", "mute", {
	plugin: "obs",
	action: "mute",
	migrateConfig(oldConfig: { sourceName: string; muted: Toggle }) {
		return {
			obs: migrateDefaultOBS(),
			source: migrateTemplateStr(oldConfig.sourceName),
			muted: oldConfig.muted,
		}
	},
})

registerOldActionMigrator("obs", "hotkey", {
	plugin: "obs",
	action: "mute",
	migrateConfig(oldConfig: { hotkey: string }) {
		return {
			obs: migrateDefaultOBS(),
			hotkey: oldConfig.hotkey,
		}
	},
})

registerOldActionMigrator("obs", "setTransform", {
	plugin: "obs",
	action: "transform",
	migrateConfig(oldConfig: {
		scene: string
		sceneItemId: string
		position: { x: number; y: number } | undefined
		rotation: number | undefined
		scale: { x: number; y: number } | undefined
		crop: { top: number; right: number; bottom: number; left: number }
		boundingBox: { boxType: OBSBoundsType; alignment: number; width: number; height: number }
	}) {
		return {
			obs: migrateDefaultOBS(),
			scene: oldConfig.scene,
			source: oldConfig.sceneItemId,
			transform: migrateOldOBSTransform(oldConfig),
		}
	},
})

registerOldActionMigrator("obs", "streamStartStop", {
	plugin: "obs",
	action: "streamStartStop",
	migrateConfig(oldConfig: { streaming: Toggle }) {
		return {
			obs: migrateDefaultOBS(),
			streaming: oldConfig.streaming,
		}
	},
})

registerOldActionMigrator("obs", "recordingStartStop", {
	plugin: "obs",
	action: "recordingStartStop",
	migrateConfig(oldConfig: { recording: Toggle }) {
		return {
			obs: migrateDefaultOBS(),
			recording: oldConfig.recording,
		}
	},
})

registerOldActionMigrator("obs", "virtualCamStartStop", {
	plugin: "obs",
	action: "virtualCamStartStop",
	migrateConfig(oldConfig: { virtualCam: Toggle }) {
		return {
			obs: migrateDefaultOBS(),
			virtualCam: oldConfig.virtualCam,
		}
	},
})

registerOldActionMigrator("obs", "replayBufferStartStop", {
	plugin: "obs",
	action: "replayBufferStartStop",
	migrateConfig(oldConfig: { virtualCam: Toggle }) {
		return {
			obs: migrateDefaultOBS(),
			replayBuffer: oldConfig.virtualCam,
		}
	},
})

registerOldActionMigrator("obs", "replaySave", {
	plugin: "obs",
	action: "replaySave",
	migrateConfig(oldConfig) {
		return {
			obs: migrateDefaultOBS(),
		}
	},
})

//////MIGRATE DISCORD//////

registerOldActionMigrator("discord", "discordMessage", {
	plugin: "discord",
	action: "discordMessage",
	migrateConfig(oldConfig: { channel: string; message: string }) {
		return {
			webhook: migrateResourceId(oldConfig.channel),
			message: migrateTemplateStr(oldConfig.message),
			files: [],
		}
	},
})

///////MIGRATE HTTP//////

registerOldActionMigrator("http", "request", {
	plugin: "http",
	action: "request",
	migrateConfig(oldConfig: { method: string; address: string; body: string }) {
		return {
			method: oldConfig.method,
			url: migrateTemplateStr(oldConfig.address),
			//TODO: Body?
		}
	},
})

registerOldTriggerMigrator("http", "endpoint", {
	plugin: "http",
	trigger: "endpoint",
	migrateConfig(oldConfig: { method: string; route: string }) {
		return {
			method: oldConfig.method,
			route: oldConfig.route,
		}
	},
})

///////MIGRATE INPUT/////////

registerOldActionMigrator("inputs", "pressKey", {
	plugin: "input",
	action: "pressKey",
	migrateConfig(oldConfig: { key: string; time: number }) {
		return {
			key: oldConfig.key,
			duration: oldConfig.time,
		}
	},
})

registerOldActionMigrator("inputs", "mouseButton", {
	plugin: "input",
	action: "mouseButton",
	migrateConfig(oldConfig: { button: string; time: number }) {
		return {
			key: oldConfig.button,
			duration: oldConfig.time,
		}
	},
})

/////MIGRATE IOT/////////
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

interface OldHbsk {
	hue?: number | string
	sat?: number | string
	bri?: number | string
	kelvin?: number
	mode: "color" | "temp"
}

function migrateOldLightColor(hbsk: OldHbsk | undefined): LightColor | undefined {
	if (!hbsk) return undefined

	if ("hue" in hbsk) {
		return `hsb(${migrateTemplateStr(hbsk.hue) ?? 0}, ${migrateTemplateStr(hbsk.sat) ?? 0}, ${
			migrateTemplateStr(hbsk.bri) ?? 0
		})` as LightColor
	} else {
		return `kb(${migrateTemplateStr(hbsk.kelvin) ?? 0}, ${migrateTemplateStr(hbsk.bri) ?? 0})` as LightColor
	}
}

registerOldActionMigrator("iot", "light", {
	plugin: "iot",
	action: "light",
	migrateConfig(oldConfig: { light: string; on: Toggle; lightColor: OldHbsk; duration: number }) {
		return {
			light: migrateIotId(oldConfig.light),
			on: oldConfig.on,
			lightColor: migrateOldLightColor(oldConfig.lightColor),
			transition: migrateTemplateStr(oldConfig.duration),
		}
	},
})

registerOldActionMigrator("iot", "plug", {
	plugin: "iot",
	action: "plug",
	migrateConfig(oldConfig: { plug: string; on: Toggle }) {
		return {
			light: migrateIotId(oldConfig.plug),
			switch: oldConfig.on,
		}
	},
})

//////MIGRATE MINECRAFT//////

function migrateDefaultMinecraftId() {
	return ""
}

registerOldActionMigrator("minecraft", "mineCmd", {
	plugin: "iot",
	action: "mineCmd",
	migrateConfig(oldConfig: { command: string }) {
		return {
			server: migrateDefaultMinecraftId(),
			command: migrateTemplateStr(oldConfig.command),
		}
	},
})

//////MIGRATE OS//////

registerOldActionMigrator("os", "shell", {
	plugin: "os",
	action: "powershell",
	migrateConfig(oldConfig: { command: string; dir: string }) {
		return {
			command: migrateTemplateStr(oldConfig.command),
			cwd: migrateTemplateStr(oldConfig.dir),
		}
	},
})

registerOldActionMigrator("os", "launch", {
	plugin: "os",
	action: "launch",
	migrateConfig(oldConfig: { application: string; dir: string; args: string[]; ignoreIfRunning: boolean }) {
		return {
			application: oldConfig.application,
			dir: oldConfig.dir,
			args: oldConfig.args.map((a) => migrateTemplateStr(a)),
			ignoreIfRunning: oldConfig.ignoreIfRunning,
		}
	},
})

//////MIGRATE OVERLAYS//////

function migrateOldOverlayWidget(widget: string) {
	//TODO:
	return widget
}

registerOldActionMigrator("overlays", "alert", {
	plugin: "overlays",
	action: "alert",
	migrateConfig(oldConfig: { alert: string; header: string; text: string }) {
		return {
			alert: migrateOldOverlayWidget(oldConfig.alert),
			title: migrateTemplateStr(oldConfig.header),
			subtitle: migrateTemplateStr(oldConfig.text),
		}
	},
})

registerOldActionMigrator("overlays", "wheelSpin", {
	plugin: "random",
	action: "spinWheel",
	migrateConfig(oldConfig: { wheel: string; strength: number }) {
		return {
			widget: migrateOldOverlayWidget(oldConfig.wheel),
			strength: migrateTemplateStr(oldConfig.strength),
		}
	},
})

registerOldTriggerMigrator("overlays", "wheelLanded", {
	plugin: "random",
	trigger: "wheelLanded",
	migrateConfig(oldConfig: { wheel: string; item: string | undefined }) {
		return {
			wheel: migrateOldOverlayWidget(oldConfig.wheel),
			item: oldConfig.item,
		}
	},
})

///////MIGRATE SOUNDS///////////////

function migrateOldMediaFile(media: string) {
	//TODO: Extra /?
	return `default\\${media}`
}

function migrateDefaultAudioOutput() {
	return "system.default"
}

function migrateDefaultTTSVoiceId() {
	//TODO
	return ""
}

registerOldActionMigrator("sounds", "sound", {
	plugin: "sound",
	action: "sound",
	migrateConfig(oldConfig: { sound: string; volume: number }) {
		return {
			output: migrateDefaultAudioOutput(),
			sound: migrateOldMediaFile(oldConfig.sound),
			volume: migrateTemplateStr(oldConfig.volume),
			startTime: 0,
		}
	},
})

registerOldActionMigrator("sounds", "tts", {
	plugin: "sound",
	action: "tts",
	migrateConfig(oldConfig: { message: string; voice: string; volume: number }) {
		return {
			output: migrateDefaultAudioOutput(),
			voice: migrateDefaultTTSVoiceId(),
			text: migrateTemplateStr(oldConfig.message),
			volume: migrateTemplateStr(oldConfig.volume),
		}
	},
})

///////MIGRATE SPELLCAST///////

function migrateSpellCastId(hookId: string) {
	//Spells now have local ids

	for (const spell of SpellHook.storage) {
		if (spell.config.spellId == hookId) {
			return spell.id
		}
	}

	return undefined
}

registerOldTriggerMigrator("spellcast", "spellHook", {
	plugin: "spellcast",
	trigger: "spellHook",
	migrateConfig(oldConfig: { hookId: string }) {
		return {
			spell: migrateSpellCastId(oldConfig.hookId),
		}
	},
})

//////MIGRATE VARIABLES///////

registerOldActionMigrator("variables", "set", {
	plugin: "variables",
	action: "set",
	migrateConfig(oldConfig: { name: string; value: any }) {
		return {
			variable: oldConfig.name,
			value: oldConfig.value,
		}
	},
})

registerOldActionMigrator("variables", "inc", {
	plugin: "variables",
	action: "offset",
	migrateConfig(oldConfig: { name: string; offset: any; clampRange: Range }) {
		return {
			variable: oldConfig.name,
			offset: migrateTemplateStr(oldConfig.offset),
			clamp: oldConfig.clampRange,
		}
	},
})

//////MIGRATE VOICEMOD///////////

registerOldActionMigrator("voicemod", "selectVoice", {
	plugin: "voicemod",
	action: "selectVoice",
	migrateConfig(oldConfig: { voice: string }) {
		return {
			voice: oldConfig.voice,
		}
	},
})

////MIGRATE TIME////////////

function migrateOldDurationString(duration: string | undefined) {
	if (duration == undefined) return undefined

	let [hours, minutes, seconds] = duration.split(":")

	if (seconds == undefined) {
		seconds = minutes
		minutes = hours
		hours = "0"
	}
	if (seconds == undefined) {
		seconds = minutes
		minutes = "0"
	}

	return Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds)
}

registerOldTriggerMigrator("time", "timer", {
	plugin: "time",
	trigger: "repeat",
	migrateConfig(oldConfig: { delay: string | undefined; interval: string | undefined }) {
		return {
			delay: migrateOldDurationString(oldConfig.delay),
			interval: migrateOldDurationString(oldConfig.interval),
		}
	},
})

//////////////////////////////////////

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
			logger.log("Testing Time Op", oldOffsetTime, pushSeq.timeOp.offset, pushSeq.timeOp.duration)
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

			logger.log("Time Offset!", offsetTime)

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
			pushSeq.timeOp = {
				action: action as TimeAction,
				offset: pushSeq.offset,
				duration,
			}

			logger.log("Setting TimeOp", pushSeq.timeOp.offset, pushSeq.timeOp.duration)
			pushSeq.offset += duration
		}
	}

	for (const oldAction of oldAutomation.actions) {
		logger.log("Migrating", oldAction.plugin, oldAction.action)
		if (oldAction.plugin == "castmate") {
			if (oldAction.action == "timestamp") {
				oldOffsetTime = Math.max(oldOffsetTime, oldAction.data as number)
				logger.log("Old Time Offset Now", oldOffsetTime)
				continue
			} else if (oldAction.action == "delay") {
				oldOffsetTime += Math.max(0, oldAction.data as number)
				logger.log("Old Time Offset Now", oldOffsetTime)
				continue
			}
		}

		const migrator = actionMigrators[oldAction.plugin]?.[oldAction.action]

		if (!migrator) {
			logger.log("MISSING!!", oldAction.plugin, oldAction.action)
			continue
		}

		const pluginKey = migrator.plugin
		const actionKey = migrator.action

		const action = PluginManager.getInstance().getAction(pluginKey, actionKey)

		if (!action) {
			logger.error("Missing Migration Action", pluginKey, actionKey)
			continue
		}

		const newConfig = await migrator.migrateConfig(oldAction.data)
		logger.log("Migrate", oldAction.data, newConfig)

		const duration = await action?.getDuration(newConfig)

		if (Number.isNaN(duration)) {
			logger.error("NAN!")
			logger.error(pluginKey, actionKey)
			logger.error(newConfig)
			throw new Error(`Got NaN duration!`)
		}

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

async function migrateInlineOldAutomation(oldAutomation: OldAutomation | string) {
	if (typeof oldAutomation == "string") {
		const migratedAutomationId = "" //TODO MIGRATE

		const result: Sequence = {
			actions: [],
		}

		result.actions.push({
			id: nanoid(),
			plugin: "castmate",
			action: "runAutomation",
			config: {
				automation: migratedAutomationId,
			},
		})

		return result
	} else {
		return await migrateOldAutomation(oldAutomation)
	}
}

async function migrateOldProfile(name: string, oldProfile: OldProfile): Promise<ProfileConfig> {
	const result: ProfileConfig = {
		name,
		triggers: [],
		activationMode: oldProfile.activationMode,
		activationCondition: {
			type: "group",
			operator: "or",
			operands: [],
		},
		activationAutomation: createInlineAutomation(),
		deactivationAutomation: createInlineAutomation(),
	}

	for (const oldPluginKey in oldProfile.triggers) {
		for (const oldTriggerKey in oldProfile.triggers[oldPluginKey]) {
			const oldTriggers = oldProfile.triggers[oldPluginKey][oldTriggerKey]

			for (const oldTrigger of oldTriggers) {
				const triggerMigrator = triggerMigrators[oldPluginKey]?.[oldTriggerKey]

				const newTrigger: TriggerData = {
					id: nanoid(),
					config: {},
					sequence: { actions: [] },
					floatingSequences: [],
				}

				templateVarOverrides = {
					user: "viewer",
					userColor: "viewer.color",
					userId: "viewer.id",
					filteredMessage: "message",
				}

				if (triggerMigrator) {
					if (triggerMigrator.templateOverrides) {
						templateVarOverrides = {
							...templateVarOverrides,
							...triggerMigrator.templateOverrides,
						}
					}

					const newTriggerConfig = await triggerMigrator.migrateConfig(oldTrigger.config)

					newTrigger.plugin = triggerMigrator.plugin
					newTrigger.trigger = triggerMigrator.trigger
					newTrigger.config = newTriggerConfig
				}

				newTrigger.sequence = await migrateInlineOldAutomation(oldTrigger.automation)

				logger.log("Migrated Trigger", newTrigger)

				result.triggers.push(newTrigger)
			}
		}
	}

	if (oldProfile.onActivate) {
		result.activationAutomation.sequence = await migrateInlineOldAutomation(oldProfile.onActivate)
	}

	if (oldProfile.onDeactivate) {
		result.deactivationAutomation.sequence = await migrateInlineOldAutomation(oldProfile.onDeactivate)
	}

	return result
}

const testOldAutomation = {
	version: "1.0",
	description: "",
	actions: [
		{
			plugin: "iot",
			action: "plug",
			data: {
				on: false,
				plug: "hue.f7eea07b-be3c-482e-bacb-bde4491af74e",
			},
			id: "I_fUN8TN5bABA6vy93C5x",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: false,
				duration: 0,
				light: "hue.c1787ef9-1246-4465-97d2-4e12f5d55632",
			},
			id: "7uGyTy-NDUaiuqNjPDLtS",
		},
		{
			plugin: "castmate",
			action: "delay",
			data: 0.5,
			id: "wsscoSrODYloSlGevCe33",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: false,
				duration: 0,
				light: "hue.ea0b625e-be0d-49c0-9f3e-78f961d76564",
			},
			id: "4JOLTDzaHYkWqd7-GCoOz",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: false,
				duration: 0,
				light: "hue.d8d1ded1-2d52-4884-81b8-ec6a8f7d307f",
			},
			id: "vG54Mi6lpn8RG9TkrOps7",
		},
		{
			plugin: "castmate",
			action: "delay",
			data: 0.2,
			id: "jEh1oe42fQd-Rw_kn8qk-",
		},
		{
			plugin: "castmate",
			action: "delay",
			data: 2,
			id: "ydweoggqWmOhB6oNApp1i",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: true,
				duration: 0,
				light: "hue.ea0b625e-be0d-49c0-9f3e-78f961d76564",
				lightColor: {
					hue: 355.81508387488157,
					sat: 100,
					bri: 100,
				},
			},
			id: "mq_DtkLpWmmBhz8iwmcdP",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: true,
				duration: 0,
				light: "hue.d8d1ded1-2d52-4884-81b8-ec6a8f7d307f",
				lightColor: {
					hue: 355.81508387488157,
					sat: 100,
					bri: 100,
				},
			},
			id: "s3-p4Ls5dIl-8lqMb7Swg",
		},
		{
			plugin: "sounds",
			action: "sound",
			data: {
				volume: 54,
				sound: "base-alarm.wav",
			},
			id: "YRVboTQhWlYgmsAMGCuVe",
		},
		{
			plugin: "castmate",
			action: "delay",
			data: 2,
			id: "mh01ZZfh44YwXy_9OaZ0a",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: false,
				duration: 0,
				light: "hue.ea0b625e-be0d-49c0-9f3e-78f961d76564",
			},
			id: "Ouo7sQk-fNToIkJeHFUb5",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: false,
				duration: 0,
				light: "hue.d8d1ded1-2d52-4884-81b8-ec6a8f7d307f",
			},
			id: "-X7DEBz7FecRpkUdvMW9t",
		},
		{
			plugin: "castmate",
			action: "delay",
			data: 1,
			id: "kUoZ6NuTUJgWvbQDTz-cp",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: true,
				duration: 0,
				light: "hue.ea0b625e-be0d-49c0-9f3e-78f961d76564",
				lightColor: {
					hue: 355.81508387488157,
					sat: 100,
					bri: 100,
				},
			},
			id: "qlWhZ4AYFnpULe2FKOgYr",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: true,
				duration: 0,
				light: "hue.d8d1ded1-2d52-4884-81b8-ec6a8f7d307f",
				lightColor: {
					hue: 355.81508387488157,
					sat: 100,
					bri: 100,
				},
			},
			id: "szMOaZre5GaBqZOjn_ydW",
		},
		{
			plugin: "sounds",
			action: "sound",
			data: {
				volume: 54,
				sound: "base-alarm.wav",
			},
			id: "vKaZAuGbnzH4vHWvOqYlA",
		},
		{
			plugin: "castmate",
			action: "delay",
			data: 2,
			id: "XS8aeYVASnToT1Eu43yde",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: false,
				duration: 0,
				light: "hue.ea0b625e-be0d-49c0-9f3e-78f961d76564",
			},
			id: "0qtSI878yjRonJyPHKHEb",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: false,
				duration: 0,
				light: "hue.d8d1ded1-2d52-4884-81b8-ec6a8f7d307f",
			},
			id: "U8qpvXatsFr8Y104uUYeJ",
		},
		{
			plugin: "castmate",
			action: "delay",
			data: 1,
			id: "ldSTVYAsIQAYx0TaP2MJ0",
		},
		{
			plugin: "iot",
			action: "plug",
			data: {
				on: true,
				plug: "hue.f7eea07b-be3c-482e-bacb-bde4491af74e",
			},
			id: "Z2clycP6iRBQz4X_gj6jX",
		},
		{
			plugin: "castmate",
			action: "delay",
			data: 0.1,
			id: "HDuTtMf7jc7BI1Zz2HLMH",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: true,
				duration: 0.5,
				light: "hue.ea0b625e-be0d-49c0-9f3e-78f961d76564",
				lightColor: {
					kelvin: 5242.525,
					bri: 100,
				},
			},
			id: "ILRNn7-1k94xSPfHNpY6Q",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: true,
				duration: 0.5,
				light: "hue.d8d1ded1-2d52-4884-81b8-ec6a8f7d307f",
				lightColor: {
					kelvin: 5242.525,
					bri: 100,
				},
			},
			id: "BQJ_yLiqwJ7IDTTHNZvNj",
		},
		{
			plugin: "castmate",
			action: "delay",
			data: 0.1,
			id: "eWhqkl2I6d3lOB8OW4zbz",
		},
		{
			plugin: "iot",
			action: "light",
			data: {
				on: true,
				duration: 0.5,
				light: "hue.c1787ef9-1246-4465-97d2-4e12f5d55632",
				lightColor: {
					kelvin: 5242.525,
					bri: 100,
				},
			},
			id: "vt6m-e9N_l9kSFSdnmcN_",
		},
		{
			plugin: "sounds",
			action: "sound",
			data: {
				volume: 100,
				sound: "door-banging.wav",
			},
			id: "L6wu181xIroOLR7RODTfQ",
		},
		{
			plugin: "twitch",
			action: "sendShoutout",
			data: {
				user: "{{ user }}",
			},
			id: "PgUWZ5t-Ah-bz993zn9GU",
		},
	],
	sync: true,
}

const testOldProfile = {
	version: "2.0",
	triggers: {
		spellcast: {
			spellHook: [
				{
					config: {
						hookId: "640e12589fb9c79bdb596676",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "kitchen-nightmare--drama.mp3",
								},
								id: "xnUdSpTZ5sUmAxb9FzAqL",
							},
							{
								plugin: "twitch",
								action: "sendChat",
								data: "{{ user }} says that's looking like a nightmare.",
								id: "t6vokUUblGnZe71RvGv-A",
							},
						],
					},
					id: "4D_aScg3rZqCQrosQvDaN",
					profile: "Kitchen",
				},
			],
		},
		http: {
			endpoint: [
				{
					config: {
						method: "POST",
						route: "/toggle_oven",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "obs",
								action: "source",
								data: {
									enabled: "toggle",
									scene: "~Oven View",
									source: "~Oven View Cam",
								},
								id: "bhLwK4HLbtmsbXCvc49cD",
							},
							{
								plugin: "variables",
								action: "set",
								data: {
									name: "OvenView",
									value: "variables.OvenView == 1 ? 0 : 1",
								},
								id: "0aLO0v0E15yadozE7_Rp2",
							},
							{
								plugin: "obs",
								action: "filter",
								data: {
									filterEnabled: "toggle",
									sourceName: "~Kitchen Oven",
									filterName: "Oven Recording",
								},
								id: "M0NZj9Vvv9X5-nkkCYdgs",
							},
						],
						sync: false,
					},
					id: "bGZIqbo0vdFhlPdt6bYE1",
					profile: "Kitchen",
				},
			],
		},
		twitch: {
			raid: [
				{
					config: {
						raiders: {
							min: 1,
						},
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "iot",
								action: "plug",
								data: {
									on: false,
									plug: "hue.f7eea07b-be3c-482e-bacb-bde4491af74e",
								},
								id: "I_fUN8TN5bABA6vy93C5x",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: false,
									duration: 0,
									light: "hue.c1787ef9-1246-4465-97d2-4e12f5d55632",
								},
								id: "7uGyTy-NDUaiuqNjPDLtS",
							},
							{
								plugin: "castmate",
								action: "delay",
								data: 0.5,
								id: "wsscoSrODYloSlGevCe33",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: false,
									duration: 0,
									light: "hue.ea0b625e-be0d-49c0-9f3e-78f961d76564",
								},
								id: "4JOLTDzaHYkWqd7-GCoOz",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: false,
									duration: 0,
									light: "hue.d8d1ded1-2d52-4884-81b8-ec6a8f7d307f",
								},
								id: "vG54Mi6lpn8RG9TkrOps7",
							},
							{
								plugin: "castmate",
								action: "delay",
								data: 0.2,
								id: "jEh1oe42fQd-Rw_kn8qk-",
							},
							{
								plugin: "castmate",
								action: "delay",
								data: 2,
								id: "ydweoggqWmOhB6oNApp1i",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: true,
									duration: 0,
									light: "hue.ea0b625e-be0d-49c0-9f3e-78f961d76564",
									lightColor: {
										hue: 355.81508387488157,
										sat: 100,
										bri: 100,
									},
								},
								id: "mq_DtkLpWmmBhz8iwmcdP",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: true,
									duration: 0,
									light: "hue.d8d1ded1-2d52-4884-81b8-ec6a8f7d307f",
									lightColor: {
										hue: 355.81508387488157,
										sat: 100,
										bri: 100,
									},
								},
								id: "s3-p4Ls5dIl-8lqMb7Swg",
							},
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 54,
									sound: "base-alarm.wav",
								},
								id: "YRVboTQhWlYgmsAMGCuVe",
							},
							{
								plugin: "castmate",
								action: "delay",
								data: 2,
								id: "mh01ZZfh44YwXy_9OaZ0a",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: false,
									duration: 0,
									light: "hue.ea0b625e-be0d-49c0-9f3e-78f961d76564",
								},
								id: "Ouo7sQk-fNToIkJeHFUb5",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: false,
									duration: 0,
									light: "hue.d8d1ded1-2d52-4884-81b8-ec6a8f7d307f",
								},
								id: "-X7DEBz7FecRpkUdvMW9t",
							},
							{
								plugin: "castmate",
								action: "delay",
								data: 1,
								id: "kUoZ6NuTUJgWvbQDTz-cp",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: true,
									duration: 0,
									light: "hue.ea0b625e-be0d-49c0-9f3e-78f961d76564",
									lightColor: {
										hue: 355.81508387488157,
										sat: 100,
										bri: 100,
									},
								},
								id: "qlWhZ4AYFnpULe2FKOgYr",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: true,
									duration: 0,
									light: "hue.d8d1ded1-2d52-4884-81b8-ec6a8f7d307f",
									lightColor: {
										hue: 355.81508387488157,
										sat: 100,
										bri: 100,
									},
								},
								id: "szMOaZre5GaBqZOjn_ydW",
							},
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 54,
									sound: "base-alarm.wav",
								},
								id: "vKaZAuGbnzH4vHWvOqYlA",
							},
							{
								plugin: "castmate",
								action: "delay",
								data: 2,
								id: "XS8aeYVASnToT1Eu43yde",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: false,
									duration: 0,
									light: "hue.ea0b625e-be0d-49c0-9f3e-78f961d76564",
								},
								id: "0qtSI878yjRonJyPHKHEb",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: false,
									duration: 0,
									light: "hue.d8d1ded1-2d52-4884-81b8-ec6a8f7d307f",
								},
								id: "U8qpvXatsFr8Y104uUYeJ",
							},
							{
								plugin: "castmate",
								action: "delay",
								data: 1,
								id: "ldSTVYAsIQAYx0TaP2MJ0",
							},
							{
								plugin: "iot",
								action: "plug",
								data: {
									on: true,
									plug: "hue.f7eea07b-be3c-482e-bacb-bde4491af74e",
								},
								id: "Z2clycP6iRBQz4X_gj6jX",
							},
							{
								plugin: "castmate",
								action: "delay",
								data: 0.1,
								id: "HDuTtMf7jc7BI1Zz2HLMH",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: true,
									duration: 0.5,
									light: "hue.ea0b625e-be0d-49c0-9f3e-78f961d76564",
									lightColor: {
										kelvin: 5242.525,
										bri: 100,
									},
								},
								id: "ILRNn7-1k94xSPfHNpY6Q",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: true,
									duration: 0.5,
									light: "hue.d8d1ded1-2d52-4884-81b8-ec6a8f7d307f",
									lightColor: {
										kelvin: 5242.525,
										bri: 100,
									},
								},
								id: "BQJ_yLiqwJ7IDTTHNZvNj",
							},
							{
								plugin: "castmate",
								action: "delay",
								data: 0.1,
								id: "eWhqkl2I6d3lOB8OW4zbz",
							},
							{
								plugin: "iot",
								action: "light",
								data: {
									on: true,
									duration: 0.5,
									light: "hue.c1787ef9-1246-4465-97d2-4e12f5d55632",
									lightColor: {
										kelvin: 5242.525,
										bri: 100,
									},
								},
								id: "vt6m-e9N_l9kSFSdnmcN_",
							},
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "door-banging.wav",
								},
								id: "L6wu181xIroOLR7RODTfQ",
							},
							{
								plugin: "twitch",
								action: "sendShoutout",
								data: {
									user: "{{ user }}",
								},
								id: "PgUWZ5t-Ah-bz993zn9GU",
							},
						],
					},
					id: "JS0L7Usc5s1WnPkSg-x5o",
					profile: "Kitchen",
				},
			],
		},
	},
	conditions: {
		operator: "any",
		operands: [
			{
				operator: "equal",
				id: "PrIIYhVCPO563s2jbT_UJ",
				state: {
					plugin: "obs",
					key: "scene",
					id: "obs.scene",
				},
				compare: "Kitchen Hands Exclusive",
			},
			{
				operator: "equal",
				id: "8tUPVdlc5bjYgoCRIKZHD",
				state: {
					plugin: "obs",
					key: "scene",
					id: "obs.scene",
				},
				compare: "Kitchen Main",
			},
			{
				operator: "equal",
				id: "_GcLsIx368bT0qL_ROpOL",
				state: {
					plugin: "obs",
					key: "scene",
					id: "obs.scene",
				},
				compare: "Kitchen Hands",
			},
			{
				operator: "equal",
				id: "6g0gO-f_qCT_N4-DFn2Ng",
				state: {
					plugin: "obs",
					key: "scene",
					id: "obs.scene",
				},
				compare: "Kitchen Oven View",
			},
		],
	},
	activationMode: "toggle",
}

const testOldProfile2 = {
	version: "2.0",
	triggers: {
		twitch: {
			redemption: [
				{
					config: {
						reward: "First",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 30,
									sound: "The Price Is Right Correct Answer Sound.mp4",
								},
								id: "B0omg96epN3h0KM81J1IK",
							},
							{
								plugin: "overlays",
								action: "alert",
								data: {
									alert: {
										overlay: "XEu5lCHbdind994KNinPW",
										widget: "xPFpXIBvwlvz_PAiG8WuL",
									},
									header: "FIRST!",
									text: "{{ user }} is first!",
									color: "{{ userColor }}",
								},
								id: "cqPy9Lg1nmdUqGqmNSqGV",
							},
							{
								plugin: "twitch",
								action: "sendChat",
								data: "!! {{ user }} is first !!",
								id: "62xvXbslEf2zwLJjDwesL",
							},
							{
								plugin: "castmate",
								action: "delay",
								data: 14,
								id: "_BYcRxeFzUz2g9Ww4OAaa",
							},
						],
						sync: false,
					},
					id: "XGzcXJKOzrSCrPmZI5sPo",
					profile: "Main Active",
				},
				{
					config: {
						reward: "Text To Speech",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "tts",
								data: {
									volume: 100,
									message: "{{ filteredMessage }}",
									voice: "Microsoft David Desktop",
								},
								id: "Da-asSoitf5MTwVsw7IpM",
							},
						],
						sync: false,
					},
					id: "MVXbI01udY0ZLteoU11Mh",
					profile: "Main Active",
				},
				{
					config: {
						reward: "Hydrate",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 80,
									sound: "water-splash-9.mp3",
								},
								id: "lnI7qBWMCtX3Lg0zaxRkn",
							},
							{
								plugin: "twitch",
								action: "sendChat",
								data: "{{ user }} is being a hydro homie",
								id: "nZwG9_gFcSRMi60QQxBGy",
							},
						],
						sync: false,
					},
					id: "CxAuPlu643k3nyzPdXWHd",
					profile: "Main Active",
				},
			],
			chat: [
				{
					config: {
						command: "!sad",
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "sad-violin_ubqUgrT.mp3",
								},
								id: "s-qQj8eJ26CTg2TB5xejR",
							},
							{
								plugin: "obs",
								action: "filter",
								data: {
									sourceName: "~Main Cam",
									filterName: "Black And White",
									filterEnabled: true,
								},
								id: "Nr4h1LRk__v0sp_AMRzgn",
							},
							{
								plugin: "obs",
								action: "filter",
								data: {
									sourceName: "~Main Cam",
									filterName: "Sad Zoomer",
									filterEnabled: true,
								},
								id: "fhy1QumjOKsvnb1qJye5H",
							},
							{
								plugin: "castmate",
								action: "delay",
								data: 10,
								id: "t50kYImR93In-SVNKP9IZ",
							},
							{
								plugin: "obs",
								action: "filter",
								data: {
									sourceName: "~Main Cam",
									filterName: "Black And White",
									filterEnabled: false,
								},
								id: "FeSi6Ta_Y4Q9PpLDCdFsa",
							},
						],
						sync: false,
					},
					id: "cuW9XE_4TPUKyQPKViQsa",
					profile: "Main Active",
				},
				{
					config: {
						command: "!drama",
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 86,
									sound: "youtube\\Dun Dun Dun.mp3",
								},
								id: "RhwxrxRTQcOeohzEili9v",
							},
							{
								plugin: "castmate",
								action: "timestamp",
								data: 1.1,
								beforeDelay: 1.1,
								id: "-mcJZWYG0nDmmvNAQ8Sn1",
							},
							{
								plugin: "obs",
								action: "filter",
								data: {
									sourceName: "~Main Cam",
									filterName: "Zoomer",
									filterEnabled: true,
								},
								id: "za2y240vmxCiTpIUhaUum",
							},
						],
						sync: false,
					},
					id: "1xhR5hQfXymkjycwFkjQ1",
					profile: "Main Active",
				},
				{
					config: {
						command: "!never",
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "never.mp3",
								},
								id: "KUIsedLnizKR_3fq5DJQk",
							},
						],
						sync: false,
					},
					id: "5pCSkwWlsACLOMfShL3_T",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!suspense",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 86,
									sound: "youtube\\Dun Dun Dun.mp3",
								},
								id: "Rasvi7aHIxXG7nUJ0gGif",
							},
							{
								plugin: "castmate",
								action: "timestamp",
								data: 1.1,
								beforeDelay: 1.1,
								id: "el5wAa2sjXOH0nkVScjv8",
							},
							{
								plugin: "obs",
								action: "filter",
								data: {
									sourceName: "~Main Cam",
									filterName: "Zoomer",
									filterEnabled: true,
								},
								id: "geSRDYRpsrKTQJ-OfX-Rg",
							},
						],
					},
					id: "JI8E249mb-vlyPSMNv8zc",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!ehhghh",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "steve.mp3",
								},
								id: "dpVz_lhCB5x1ancRmduwR",
							},
						],
						sync: false,
					},
					id: "loZOJ7K8PggpR7v8crMs-",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!english",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "failenglish.mp3",
								},
								id: "SI8vaYPqq-NBhoqNlkxlC",
							},
						],
					},
					id: "AsaWoWWAk3ublidSCEz2Q",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!fart",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "youtube\\Fart 1.mp3",
								},
								id: "OZq0rYUAEriNHtYEbkSku",
							},
						],
						sync: false,
					},
					id: "aDAfqTrFW_LwM_WK7y0vd",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!figure",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "figureitout.mp3",
								},
								id: "f42lviCwAGVQ0Cz2qce2y",
							},
						],
					},
					id: "8sRJgJhNbBhJ6AYD58AK8",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!fubar",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 56,
									sound: "fubar.wav",
								},
								id: "OzQjvA9BH2HQeGYNNVxpz",
							},
						],
						sync: false,
					},
					id: "zqfroJPgM8usH-VTvN2-3",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!geez",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "jeez.mp3",
								},
								id: "UOFU5zE1T6i4YU5590LlW",
							},
						],
					},
					id: "MIwkg_WOVFf4DlUscCX58",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!jeez",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "jeez.mp3",
								},
								id: "tr9fo8SjrWDH1iELIZAQy",
							},
						],
					},
					id: "8WPeH56FB6PEHgD7tyDkH",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!nintendo",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "nintendo.mp3",
								},
								id: "-cVLUXuorKLgQH8eFNVr7",
							},
						],
					},
					id: "B5GCoRyTQ_Z5OhEoNsfNI",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!organic",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "organic.mp3",
								},
								id: "Fe_4p_e5zMY_yF4TORQ0U",
							},
						],
					},
					id: "hmQ7N7J_EZ8tEhsBIaTbj",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!ricktler",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "ricktler.mp3",
								},
								id: "SCvaGh0nGbM7cZfTUdqJY",
							},
						],
					},
					id: "mqXqGdBGXDnL3Yx1XvHmJ",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!rimshot",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "youtube\\Badum Tsss.mp3",
								},
								id: "dnRE6vIoYMQLFjBz51Mce",
							},
						],
						sync: false,
					},
					id: "MjW6zj5gWq3c3ylHnaYrP",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!scream",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 80,
									sound: "youtube\\wilhelm.mp3",
								},
								id: "fQpvBTDNlhM6RtCWmAvNF",
							},
						],
						sync: false,
					},
					id: "x74JgMn-kOIYjguGVc6e-",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!secret",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 81,
									sound: "secret.mp3",
								},
								id: "ODlv66sjLOGMRIh82lk2V",
							},
						],
					},
					id: "ZnnFcwzziirnvOqybiZz1",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!slap",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "youtube\\Slap.mp3",
								},
								id: "SYxbOA59S56hiBNTzlxyU",
							},
						],
					},
					id: "l0ECU7FR4eithdU2Opl1P",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!yep",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "yep.mp3",
								},
								id: "SS3I0Qce4uMxNV-Rqg834",
							},
						],
					},
					id: "NfTI4d1_VCxn8jHL0Jnsu",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!yes",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "yes.mp3",
								},
								id: "51Zx4kAZvooKOgqYlhtio",
							},
						],
					},
					id: "ug6mIloijdX7SW-7NiGDt",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!opinion",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "thats-my-opinion.mp3",
								},
								id: "gmatE0RsZYaVoXv3icCqN",
							},
						],
					},
					id: "56PRLvyufFjXc8ZDdWroA",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!ohno",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "Ohno.mp3",
								},
								id: "n5E_8uytFRDEfLNrXugF3",
							},
						],
						sync: false,
					},
					id: "nJRKMpQ2quSTcmP_T5P46",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!commands",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "twitch",
								action: "sendChat",
								data: "Commands: https://gist.github.com/LordTocs/f94eddff25a2c0da583eb0a7ec25cfc3",
								id: "kBCObzl4sVQIqUE2iPXYH",
							},
						],
						sync: false,
					},
					id: "vAO74PF1MkKsknlhWMsUR",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!oven",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "twitch",
								action: "sendChat",
								data: "It's the Anova Precision Oven. It's got steam injection! https://anovaculinary.com/products/anova-precision-oven",
								id: "fDS6u6x4nAG_7mlxX_L8j",
							},
						],
						sync: false,
					},
					id: "DWeHubXGjMcn3udaTlHJG",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!kofi",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "twitch",
								action: "sendChat",
								data: "You can send me muuuney here: https://ko-fi.com/lordtocs But only if you reeeaally want to.",
								id: "6h17wxVzjNLRjlemmZB5X",
							},
						],
					},
					id: "ECkvbJtquEpeU94S6oCm8",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!yeah",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 47,
									sound: "usher-yeah.wav",
								},
								id: "dW3-IoFq0Bkjr4TOWwSOz",
							},
						],
						sync: false,
					},
					id: "Nw7W41L-zaw-wJTmvnMA_",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!nope",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "engineer_no01.mp3",
								},
								id: "Zy80rHiBheci6DMMpYdl1",
							},
						],
						sync: false,
					},
					id: "CnBbql-5taz9GZ4zwEtC9",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!wishlist",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "twitch",
								action: "sendChat",
								data: "https://www.amazon.com/hz/wishlist/ls/1JYJSNRH3DMDM",
								id: "lgDt0AWpRDklrpsEbSGDf",
							},
						],
						sync: false,
					},
					id: "x3E3NTeDHxDNul_ugMrpb",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!right",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "probablyright.mp3",
								},
								id: "vuVPxRciMRJQqXCGGy6bZ",
							},
						],
					},
					id: "WP6vodivzqaVy7Y3Uwu6M",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!rs",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 100,
									sound: "youtube\\Badum Tsss.mp3",
								},
								id: "FThjiZ6I3x-ZpiQU-Jc9I",
							},
						],
					},
					id: "nFhDkhPSImLuipzL47v03",
					profile: "Main Active",
				},
				{
					config: {
						match: "Start",
						permissions: {
							viewer: true,
							sub: true,
							vip: true,
							mod: true,
							streamer: true,
						},
						command: "!huh",
					},
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "sounds",
								action: "sound",
								data: {
									volume: 78,
									sound: "huh-cat-meme.mp3",
								},
								id: "TOM9B97vABzEx_Jrn1VSY",
							},
						],
						sync: false,
					},
					id: "ZVVMyCwmfdnovx4d3wws2",
					profile: "Main Active",
				},
			],
			follow: [
				{
					config: null,
					automation: {
						version: "1.0",
						description: "",
						actions: [
							{
								plugin: "castmate",
								action: "automation",
								data: {
									automation: "Zelda",
								},
								id: "I2h_-auinNKIMECpTvIor",
							},
							{
								plugin: "twitch",
								action: "sendChat",
								data: "Thanks for the follow @{{user}}!",
								id: "UGQsLMWIQBpUlh7-8tO75",
							},
							{
								plugin: "overlays",
								action: "alert",
								data: {
									alert: {
										overlay: "XEu5lCHbdind994KNinPW",
										widget: "BX2C_yUopXcY8wMZXALz0",
									},
									header: "New Follow",
									text: "{{ user }}",
									color: "{{ userColor }}",
								},
								id: "-ABOwrUcoGsIvjtHaBklM",
							},
						],
						sync: false,
					},
					id: "7BJ0PLfrIkOpguBDIZtYZ",
					profile: "Main Active",
				},
			],
		},
	},
	conditions: {
		operator: "all",
		operands: [
			{
				operator: "notEqual",
				state: {
					plugin: "obs",
					key: "scene",
				},
				compare: "Starting",
			},
			{
				operator: "notEqual",
				id: "amTTjkx-mjZ_ddc1H3Ndu",
				state: {
					plugin: "obs",
					key: "scene",
					id: "obs.scene",
				},
				compare: "Starting New",
			},
		],
	},
	activationMode: "toggle",
}

export async function testMigrateAutomation() {
	let existing: Automation | undefined

	logger.log("Testing Migrate!")

	for (const auto of Automation.storage) {
		if (auto.config.name == "Test Migrate") {
			existing = auto
			logger.log("Found Existing Test Automation")
			break
		}
	}

	let needsInject = false
	if (!existing) {
		needsInject = true
		logger.log("Creating New Test Automation")
		existing = await ResourceRegistry.getInstance().create<Automation>("Automation", "Test Migrate")
	}

	if (!existing) {
		logger.error("HELP I DIDN'T FIND ANY AUTOMATION")
		return
	}

	logger.log("Do Migrate")
	await existing.setConfig({
		name: "Test Migrate",
		floatingSequences: [],
		sequence: await migrateOldAutomation(testOldAutomation),
	})
}

export async function testMigrate() {
	let existing: Profile | undefined

	logger.log("Testing Migrate!")

	const testName = "Migrate Profile"

	for (const auto of Profile.storage) {
		if (auto.config.name == testName) {
			existing = auto
			logger.log("Found Existing Test Automation")
			break
		}
	}

	if (!existing) {
		logger.log("Creating New Test Automation")
		existing = await ResourceRegistry.getInstance().create<Profile>("Profile", testName)
	}

	//@ts-ignore
	const migratedConfig = await migrateOldProfile(testName, testOldProfile2)

	await existing?.setConfig(migratedConfig)
}
