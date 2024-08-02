import {
	AnyAction,
	AutomationConfig,
	BooleanExpression,
	BooleanSubExpressionGroup,
	BooleanValueExpression,
	Color,
	Command,
	CommandModeCommand,
	DelayedResolver,
	InstantAction,
	MaybePromise,
	OffsetActions,
	ProfileConfig,
	Range,
	RegexModeCommand,
	Sequence,
	StreamPlanConfig,
	StreamPlanSegment,
	StringModeCommand,
	TemplateRange,
	TimeAction,
	Toggle,
	TriggerData,
	createDelayedResolver,
	createInlineAutomation,
	getTypeByConstructor,
	isTimeAction,
	isValidJSName,
	parseTemplateString,
} from "castmate-schema"
import {
	Automation,
	PluginManager,
	Profile,
	ResourceRegistry,
	defineCallableIPC,
	defineIPCFunc,
	ensureDirectory,
	loadYAML,
	resolveProjectPath,
	usePluginLogger,
	writeSecretYAML,
	writeYAML,
} from "castmate-core"
import { nanoid } from "nanoid/non-secure"
import { LightColor } from "castmate-plugin-iot-shared"
import { TwitchViewer, TwitchViewerGroup, TwitchViewerUnresolved } from "castmate-plugin-twitch-shared"
import { ChannelPointReward, TwitchAccount } from "castmate-plugin-twitch-main"
import { OBSBoundsType, OBSConnectionConfig, OBSSourceTransform } from "castmate-plugin-obs-shared"
import { SpellHook } from "castmate-plugin-spellcast-main"
import { OBSConnection } from "castmate-plugin-obs-main"
import fs, { unlink } from "fs/promises"
import fsSync from "fs"
import path from "path"
import { RCONConnectionConfig } from "castmate-plugin-minecraft-shared"
import axios from "axios"
import { tryWyzeLogin } from "castmate-plugin-wyze-main"
import { WyzeAccountConfig, WyzeAccountSecrets } from "castmate-plugin-wyze-shared"
import {
	OverlayBlockStyle,
	OverlayConfig,
	OverlayTextAlignment,
	OverlayTextStyle,
	OverlayTransitionAnimation,
	OverlayWidgetConfig,
	OverlayWidgetPosition,
	OverlayWidgetSize,
} from "castmate-plugin-overlays-shared"

import archiver from "archiver"
import { DiscordWebhookConfig } from "castmate-plugin-discord-shared"

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
	sync?: boolean
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
	conditions?: OldBooleanGroup
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

interface SettingMigrator {
	plugin: string
	migrateSettings(
		oldSettings: any,
		oldSecrets: any
	): MaybePromise<{
		settings: {}
		secrets: {}
	}>
}

const settingsMigrators: Record<string, SettingMigrator> = {}

function registerOldSettingsMigrator(oldPlugin: string, migrator: SettingMigrator) {
	settingsMigrators[oldPlugin] = migrator
}

let templateVarOverrides: Record<string, string> = {}

async function migrateCreateFileResource<T = any>(dir: string, config: T) {
	const newId = nanoid()

	await ensureDirectory(resolveProjectPath(dir))

	await writeYAML(config, dir, `${newId}.yaml`)

	return newId
}

async function migrateCreateAccountResource<Config = any, Secrets = any>(
	dir: string,
	id: string,
	config: Config,
	secrets: Secrets
) {
	await ensureDirectory(resolveProjectPath("accounts", dir))

	await writeYAML(config, "accounts", dir, `${id}.yaml`)
	await writeSecretYAML(secrets, "accounts", dir, `${id}.syaml`)
}

function migrateTemplateStr<T>(templateStr: T | string | undefined) {
	if (typeof templateStr != "string") return templateStr

	if (!stringIsTemplate(templateStr)) return templateStr

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

function migrateBracketlessNumberTemplate(temp: number | string | undefined) {
	if (temp == null || typeof temp == "number") return temp

	return `{{ ${migrateTemplateStr(temp)} }}`
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

registerOldActionMigrator("castmate", "delay", {
	plugin: "time",
	action: "delay",
	migrateConfig(oldConfig) {
		return {
			duration: migrateBracketlessNumberTemplate(oldConfig),
		}
	},
})

let mainQueueId = ""

registerOldSettingsMigrator("castmate", {
	plugin: "castmate",
	async migrateSettings(oldSettings: { port: number | undefined }, oldSecrets) {
		const settings: Record<string, any> = {}

		if (oldSettings.port != null) {
			settings.port = oldSettings.port
		}

		mainQueueId = await migrateCreateFileResource("queues", {
			name: "Main",
			paused: false,
			gap: 0,
		})

		return { settings, secrets: {} }
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
			duration: migrateBracketlessNumberTemplate(oldConfig.duration),
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
			duration: migrateBracketlessNumberTemplate(oldConfig.duration) ?? 15,
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
/// MIGRATE OBS

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

registerOldSettingsMigrator("obs", {
	plugin: "obs",
	async migrateSettings(oldSettings: { port: number; hostname: string }, oldSecrets: { password: string }) {
		const mainObsId = await migrateCreateFileResource<OBSConnectionConfig>("./obs/connections", {
			name: "Main OBS",
			host: oldSettings.hostname,
			port: oldSettings.port,
			password: oldSecrets.password,
		})
		return {
			settings: {
				obsDefault: mainObsId,
			},
			secrets: {},
		}
	},
})

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
			text: migrateTemplateStr(oldConfig.text) ?? "",
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

interface OldDiscordHookConfig {
	name: string
	url: string
}

async function migrateOldDiscordHook(id: string) {
	const config = (await loadYAML("discordhooks", `${id}.yaml`)) as OldDiscordHookConfig

	const newConfig: DiscordWebhookConfig = {
		name: config.name,
		webhookUrl: config.url,
	}

	await writeYAML(newConfig, "discord", "webhooks", `${id}.yaml`)

	await fs.unlink(resolveProjectPath("discordhooks", `${id}.yaml`))
}

registerOldSettingsMigrator("discord", {
	plugin: "discord",
	async migrateSettings(oldSettings, oldSecrets) {
		const dir = resolveProjectPath("discordhooks")
		const files = await fs.readdir(dir)

		await ensureDirectory(resolveProjectPath("discord", "webhooks"))

		for (const file of files) {
			const id = path.basename(file, ".yaml")
			try {
				await migrateOldDiscordHook(id)
			} catch (err) {
				logger.error("Error Migrating", id, err)
			}
		}

		await fs.rm(dir, { recursive: true, force: true })

		return {
			secrets: {},
			settings: {},
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

registerOldSettingsMigrator("tplink", {
	plugin: "tplink-kasa",
	migrateSettings(oldSettings: { broadcastMask: string | undefined }, oldSecrets) {
		return {
			settings: {
				subnetMask: oldSettings.broadcastMask ?? "255.255.255.255",
			},
			secrets: {},
		}
	},
})

registerOldSettingsMigrator("twinkly", {
	plugin: "tplink-kasa",
	migrateSettings(oldSettings: { subnetMask: string | undefined }, oldSecrets) {
		return {
			settings: {
				subnetMask: oldSettings.subnetMask ?? "255.255.255.255",
			},
			secrets: {},
		}
	},
})

registerOldSettingsMigrator("wyze", {
	plugin: "wyze",
	async migrateSettings(
		oldSettings: { username: string | undefined },
		oldSecrets: { password: string | undefined; keyId: string | undefined; apiKey: string | undefined }
	) {
		//Migrate wyze account
		if (oldSecrets.apiKey && oldSecrets.keyId && oldSecrets.password && oldSettings.username) {
			try {
				const tokens = await tryWyzeLogin(
					oldSecrets.keyId,
					oldSecrets.apiKey,
					oldSettings.username,
					oldSecrets.password
				)

				if (tokens) {
					await migrateCreateAccountResource<WyzeAccountConfig, WyzeAccountSecrets>(
						"wyze",
						"main",
						{
							name: "Wyze Account",
							scopes: [],
							email: oldSettings.username,
						},
						{
							...tokens,
						}
					)
				}
			} catch (err) {}
		}

		return {
			settings: {},
			secrets: {
				keyId: oldSecrets.keyId,
				apiKey: oldSecrets.apiKey,
			},
		}
	},
})

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
		return `hsb(${migrateBracketlessNumberTemplate(hbsk.hue) ?? 0}, ${
			migrateBracketlessNumberTemplate(hbsk.sat) ?? 0
		}, ${migrateBracketlessNumberTemplate(hbsk.bri) ?? 0})` as LightColor
	} else {
		return `kb(${migrateBracketlessNumberTemplate(hbsk.kelvin) ?? 0}, ${
			migrateBracketlessNumberTemplate(hbsk.bri) ?? 0
		})` as LightColor
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
			transition: migrateBracketlessNumberTemplate(oldConfig.duration),
		}
	},
})

registerOldActionMigrator("iot", "plug", {
	plugin: "iot",
	action: "plug",
	migrateConfig(oldConfig: { plug: string; on: Toggle }) {
		return {
			plug: migrateIotId(oldConfig.plug),
			switch: oldConfig.on,
		}
	},
})

//////MIGRATE MINECRAFT//////

let defaultMinecraftId: string | undefined = undefined

registerOldSettingsMigrator("minecraft", {
	plugin: "minecraft",
	async migrateSettings(oldSettings: { host?: string; port?: number }, oldSecrets: { password?: string }) {
		if (oldSettings?.host && oldSettings?.port && oldSecrets?.password) {
			defaultMinecraftId = await migrateCreateFileResource<RCONConnectionConfig>("./minecraft/connections", {
				name: "Main Minecraft Server",
				host: oldSettings.host,
				port: oldSettings.port,
				password: oldSecrets.password,
			})
		}

		return { settings: {}, secrets: {} }
	},
})

function migrateDefaultMinecraftId() {
	return defaultMinecraftId
}

registerOldActionMigrator("minecraft", "mineCmd", {
	plugin: "minecraft",
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

interface OldOverlayWidgetConfig {
	id: string
	name: string
	type: string
	props: object
	size: OverlayWidgetSize
	position: OverlayWidgetPosition
	locked: boolean
}

interface OldOverlayConfig {
	name: string
	width: number
	height: number
	widgets: OldOverlayWidgetConfig[]
}

const widgetMigrators: Record<
	string,
	{
		plugin: string
		widget: string
		migrateConfig(oldConfig: any): MaybePromise<any>
	}
> = {}

interface OldTextStyle {
	fontSize: number
	fontColor: string
	fontFamily: string
	fontWeight: number
	stroke?: {
		width: number
		color: string
	}
	shadow?: {
		offsetX: number
		offsetY: number
		blur: number
		color: string
	}
	textAlign: "left" | "right" | "center" | "justify"
}

function migrateOldFontStyle(old: OldTextStyle | undefined): OverlayTextStyle | undefined {
	if (old == null) return undefined

	function migrateOverlayColor(color: string | object): Color {
		if (typeof color == "object") {
			return "#000000"
		}
		return color as Color
	}

	return {
		fontSize: old.fontSize,
		fontColor: migrateOverlayColor(old.fontColor),
		fontFamily: old.fontFamily,
		fontWeight: old.fontWeight,
		stroke: old.stroke
			? {
					width: old.stroke.width,
					color: migrateOverlayColor(old.stroke.color),
			  }
			: undefined,
		shadow: old.shadow
			? {
					offsetX: old.shadow.offsetX,
					offsetY: old.shadow.offsetY,
					blur: old.shadow.blur,
					color: migrateOverlayColor(old.shadow.color),
			  }
			: undefined,
	}
}

interface OldOverlayTransition {
	animation: string
	duration: number
}

function migrateOldOverlayTransition(old: OldOverlayTransition | undefined): OverlayTransitionAnimation | undefined {
	if (old == null) return undefined

	return {
		duration: old.duration ?? 0,
		preset: old.animation,
	}
}

interface OldOverlayPadding {
	left?: number
	right?: number
	top?: number
	bottom?: number
}

function migrateOldOverlayPadding(old: OldOverlayPadding | undefined): OverlayBlockStyle | undefined {
	if (old == null) return undefined

	return {
		margin: { left: 0, right: 0, top: 0, bottom: 0 },
		padding: { left: old.left ?? 0, right: old.right ?? 0, top: old.top ?? 0, bottom: old.bottom ?? 0 },
		horizontalAlign: "left",
		verticalAlign: "top",
	}
}

interface OldOverlayTransitionTiming {
	appearDelay?: number
	vanishAdvance?: number
}

function migrateOldTextAlign(
	align: "left" | "center" | "right" | "justify" | undefined,
	defaultAlign?: "left" | "center" | "right" | "justify"
): OverlayTextAlignment | undefined {
	if (align == null) {
		if (!defaultAlign) return undefined
		return {
			textAlign: defaultAlign,
		}
	}

	return {
		textAlign: align,
	}
}

widgetMigrators["Label"] = {
	plugin: "overlays",
	widget: "label",
	migrateConfig(oldConfig: { message: string; textStyle: OldTextStyle }) {
		return {
			message: oldConfig.message ?? "",
			font: migrateOldFontStyle(oldConfig.textStyle) ?? OverlayTextStyle.factoryCreate(),
			textAlign: migrateOldTextAlign(oldConfig.textStyle?.textAlign, "left"),
			block: OverlayBlockStyle.factoryCreate(),
		}
	},
}

widgetMigrators["EmoteBouncer"] = {
	plugin: "overlays",
	widget: "emote-bounce",
	migrateConfig(oldConfig: {
		lifeTime?: number
		emoteSize?: Range
		velocityMax?: number
		shakeTime?: number
		shakeStrength?: number
		gravityXScale?: number
		gravityYScale?: number
		spamPrevention: { emoteRatio?: number; emoteCap?: number; emoteCapPerMessage?: number }
	}) {
		return {
			lifeTime: { min: oldConfig.lifeTime ?? 7, max: oldConfig.lifeTime ?? 7 },
			emoteSize: { min: oldConfig.emoteSize?.min ?? 80, max: oldConfig.emoteSize?.max ?? 80 },
			velocityMax: oldConfig.velocityMax ?? 0.4,
			shakeTime: oldConfig.shakeTime ?? 5,
			shakeStrength: oldConfig.shakeStrength ?? 1,
			gravityXScale: oldConfig.gravityXScale ?? 0,
			gravityYScale: oldConfig.gravityYScale ?? 1,
			spamPrevention: {
				emoteRatio: oldConfig.spamPrevention?.emoteRatio,
				emoteCap: oldConfig.spamPrevention?.emoteCap,
				emoteCapPerMessage: oldConfig.spamPrevention?.emoteCapPerMessage,
			},
		}
	},
}

widgetMigrators["Alert"] = {
	plugin: "overlays",
	widget: "alert",
	migrateConfig(oldConfig: {
		media: string
		duration: number
		transition: OldOverlayTransition
		textBelowMedia: boolean
		titleFormat: {
			style: OldTextStyle
			padding: OldOverlayPadding
			transition: OldOverlayTransition
			timing: OldOverlayTransitionTiming
		}
		messageFormat: {
			style: OldTextStyle
			padding: OldOverlayPadding
			transition: OldOverlayTransition
			timing: OldOverlayTransitionTiming
		}
	}) {
		return {
			transition: migrateOldOverlayTransition(oldConfig.transition),
			media: [{ media: migrateOldMediaFile(oldConfig.media), duration: oldConfig.duration, weight: 1 }],
			textBelowMedia: oldConfig.textBelowMedia,
			title: {
				font: migrateOldFontStyle(oldConfig.titleFormat.style),
				textAlign: migrateOldTextAlign(oldConfig.titleFormat.style.textAlign, "center"),
				block: migrateOldOverlayPadding(oldConfig.titleFormat.padding),
				transition: migrateOldOverlayTransition(oldConfig.titleFormat.transition),
				appearDelay: oldConfig.titleFormat.timing?.appearDelay ?? 0,
				vanishAdvance: oldConfig.titleFormat.timing?.vanishAdvance ?? 0,
			},
			subtitle: {
				font: migrateOldFontStyle(oldConfig.messageFormat.style),
				textAlign: migrateOldTextAlign(oldConfig.messageFormat.style.textAlign, "center"),
				block: migrateOldOverlayPadding(oldConfig.messageFormat.padding),
				transition: migrateOldOverlayTransition(oldConfig.messageFormat.transition),
				appearDelay: oldConfig.messageFormat.timing?.appearDelay ?? 0,
				vanishAdvance: oldConfig.messageFormat.timing?.vanishAdvance ?? 0,
			},
		}
	},
}

widgetMigrators["Wheel"] = {
	plugin: "random",
	widget: "wheel",
	migrateConfig(oldConfig: {
		slices?: number
		items: {
			text?: string
			colorOverride?: Color
			fontOverride?: OldTextStyle
			clickOverride?: string
		}[]
		colors: {
			color?: Color
			font?: OldTextStyle
			click?: string
		}[]
		damping: {
			base?: number
			coefficient?: number
		}
		clicker: {
			color?: Color
			height?: number
			width?: number
			inset?: number
		}
	}) {
		return {
			slices: oldConfig.slices ?? 12,
			items: oldConfig.items.map((i) => ({
				text: i.text ?? "",
				colorOverride: i.clickOverride,
				fontOverride: migrateOldFontStyle(i.fontOverride),
				textAlignOverride: migrateOldTextAlign(i.fontOverride?.textAlign),
			})),
			style: oldConfig.colors.map((c) => ({
				color: c.color,
				font: migrateOldFontStyle(c.font),
				textAlign: migrateOldTextAlign(c.font?.textAlign, "center"),
				block: OverlayBlockStyle.factoryCreate({ verticalAlign: "center" }),
			})),
			damping: {
				base: oldConfig.damping?.base ?? 6,
				coefficient: oldConfig.damping?.coefficient ?? 0.1,
			},
			clicker: {
				color: oldConfig.clicker?.color ?? "#A87B0B",
				height: oldConfig.clicker?.height ?? 40,
				width: oldConfig.clicker?.width ?? 80,
				inset: oldConfig.clicker?.inset ?? 40,
			},
		}
	},
}

async function migrateOldOverlay(file: string) {
	const oldOverlayConfig: OldOverlayConfig = await loadYAML("overlays", file)
	const newConfig: OverlayConfig = {
		name: oldOverlayConfig.name,
		size: { width: oldOverlayConfig.width, height: oldOverlayConfig.height },
		widgets: [],
	}

	for (const oldWidget of oldOverlayConfig.widgets) {
		const migrator = widgetMigrators[oldWidget.type]

		const newWidgetConfig: OverlayWidgetConfig = {
			id: oldWidget.id,
			plugin: migrator.plugin,
			widget: migrator.widget,
			name: oldWidget.name,
			size: oldWidget.size,
			position: oldWidget.position,
			config: await migrator.migrateConfig(oldWidget.props),
			locked: oldWidget.locked,
			visible: true,
		}

		newConfig.widgets.push(newWidgetConfig)
	}

	await writeYAML(newConfig, "overlays", file)
}

registerOldSettingsMigrator("overlays", {
	plugin: "overlays",
	async migrateSettings(oldSettings, oldSecrets) {
		//TODO: await migrate overlay!
		const dir = resolveProjectPath("overlays")
		const files = await fs.readdir(dir)

		for (const id of files) {
			try {
				await migrateOldOverlay(id)
			} catch (err) {
				logger.error("Error Migrating", id, err)
			}
		}

		return { settings: {}, secrets: {} }
	},
})

interface OldWidget {
	overlay: string
	widget: string
}

function migrateOldOverlayWidget(widget: OldWidget | undefined) {
	if (!widget) return undefined

	return { overlayId: widget.overlay, widgetId: widget.widget }
}

registerOldActionMigrator("overlays", "alert", {
	plugin: "overlays",
	action: "alert",
	migrateConfig(oldConfig: { alert: OldWidget; header: string; text: string }) {
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
	migrateConfig(oldConfig: { wheel: OldWidget; strength: number }) {
		return {
			widget: migrateOldOverlayWidget(oldConfig.wheel),
			strength: migrateBracketlessNumberTemplate(oldConfig.strength),
		}
	},
})

registerOldTriggerMigrator("overlays", "wheelLanded", {
	plugin: "random",
	trigger: "wheelLanded",
	migrateConfig(oldConfig: { wheel: OldWidget; item: string | undefined }) {
		return {
			wheel: migrateOldOverlayWidget(oldConfig.wheel),
			item: oldConfig.item,
		}
	},
})

///////MIGRATE SOUNDS///////////////

function migrateOldMediaFile(media: string) {
	return `default\\${media}`
}

function migrateDefaultAudioOutput() {
	return "system.default"
}

function migrateDefaultTTSVoiceId() {
	return undefined
}

registerOldSettingsMigrator("sounds", {
	plugin: "sound",
	migrateSettings(oldSettings: { globalVolume: number }, oldSecrets) {
		return { settings: { globalVolume: oldSettings.globalVolume ?? 100 }, secrets: {} }
	},
})

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

interface OldVariableDefinition {
	type: "Number" | "String"
	default: any
	serialized: boolean
}

interface NewVariableDefinition {
	type: string
	serialized: boolean
	defaultValue: any
	savedValue?: any
}

registerOldSettingsMigrator("variables", {
	plugin: "variables",
	async migrateSettings(oldSettings, oldSecrets) {
		//Migrate variables.yaml
		const oldVariables: Record<string, OldVariableDefinition> = await loadYAML(resolveProjectPath("variables.yaml"))
		const oldState: Record<string, Record<string, any>> = await loadYAML(resolveProjectPath("state.yaml"))

		const newVariables: Record<string, NewVariableDefinition> = {}

		for (const varName in oldVariables) {
			if (!isValidJSName(varName)) {
				logger.log("INVALID VARIABLE", varName)
				continue
			}

			const oldVar = oldVariables[varName]

			const newVar: NewVariableDefinition = {
				type: oldVar.type,
				serialized: oldVar.serialized,
				defaultValue: oldVar.default,
			}

			if (oldVar.serialized) {
				newVar.savedValue = oldState["variables"][varName]
			}

			newVariables[varName] = newVar
		}

		await ensureDirectory(resolveProjectPath("variables"))
		await writeYAML(newVariables, "variables", "variables.yaml")
		await unlink(resolveProjectPath("variables.yaml"))

		return {
			settings: {},
			secrets: {},
		}
	},
})

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

function migrateOldRangeTemplate(oldRange: TemplateRange | undefined): TemplateRange | undefined {
	if (oldRange == null) return undefined

	return {
		...(oldRange.min ? { min: migrateBracketlessNumberTemplate(oldRange.min) } : {}),
		...(oldRange.max ? { max: migrateBracketlessNumberTemplate(oldRange.max) } : {}),
	}
}

registerOldActionMigrator("variables", "inc", {
	plugin: "variables",
	action: "offset",
	migrateConfig(oldConfig: { name: string; offset: any; clampRange: TemplateRange }) {
		return {
			variable: oldConfig.name,
			offset: migrateBracketlessNumberTemplate(oldConfig.offset),
			clamp: migrateOldRangeTemplate(oldConfig.clampRange),
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

	if (!oldAutomation) {
		return result
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
			} else if (oldAction.action == "delay" && typeof oldAction.data == "number") {
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

function getAutomationByName(name: string) {
	for (const auto of Automation.storage) {
		if (auto.config.name == name) return auto
	}

	return undefined
}

async function migrateInlineOldAutomation(oldAutomation: OldAutomation | string) {
	if (typeof oldAutomation == "string") {
		const migratedAutomation = getAutomationByName(oldAutomation)

		const result: Sequence = {
			actions: [],
		}

		result.actions.push({
			id: nanoid(),
			plugin: "castmate",
			action: "runAutomation",
			config: {
				automation: migratedAutomation?.id,
			},
		})

		return result
	} else {
		return await migrateOldAutomation(oldAutomation)
	}
}

interface OldBooleanValue {
	plugin: string
	key: string
}

interface OldBooleanStateCompare {
	operator: "lessThanEq" | "lessThan" | "equal" | "notEqual" | "greaterThan" | "greaterThanEq"
	state: OldBooleanValue
	compare: any
}

interface OldBooleanGroup {
	operator: "all" | "any"
	operands: (OldBooleanGroup | OldBooleanStateCompare)[]
}

function migrateOldCondition(group: OldBooleanGroup) {
	const result: BooleanExpression = {
		type: "group",
		operator: group.operator == "all" ? "and" : "or",
		operands: [],
	}

	for (const operand of group.operands) {
		if ("operands" in operand) {
			const subExp: BooleanSubExpressionGroup = {
				id: nanoid(),
				...migrateOldCondition(operand),
			}
			result.operands.push(subExp)
		} else {
			const newState = PluginManager.getInstance().getState(operand.state.plugin, operand.state.key)

			const stateTypeName = newState?.schema?.type
				? getTypeByConstructor(newState.schema.type)?.name ?? "String"
				: "String"

			const valueExp: BooleanValueExpression = {
				type: "value",
				id: nanoid(),
				operator: operand.operator,
				lhs: {
					type: "state",
					plugin: operand.state.plugin,
					state: operand.state.key,
				},
				rhs: {
					type: "value",
					schemaType: stateTypeName,
					value: operand.compare,
				},
			}
			result.operands.push(valueExp)
		}
	}

	return result
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
				try {
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
						argString: "commandMessage",
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

					if (typeof oldTrigger?.automation == "object") {
						if (oldTrigger?.automation?.sync) {
							newTrigger.queue = mainQueueId
						}
					}

					logger.log("Migrated Trigger", newTrigger)

					result.triggers.push(newTrigger)
				} catch (err) {
					logger.error("Error Migrating Trigger", oldPluginKey, oldTriggerKey, err)
				}
			}
		}
	}

	if (oldProfile.onActivate) {
		try {
			result.activationAutomation.sequence = await migrateInlineOldAutomation(oldProfile.onActivate)
		} catch (err) {
			logger.error("Error Migrating OnActivate", err)
		}
	}

	if (oldProfile.onDeactivate) {
		try {
			result.deactivationAutomation.sequence = await migrateInlineOldAutomation(oldProfile.onDeactivate)
		} catch (err) {
			logger.error("Error Migrating OnDeactivate")
		}
	}

	if (oldProfile.conditions) {
		try {
			result.activationCondition = migrateOldCondition(oldProfile.conditions)
		} catch (err) {
			logger.error("Error Migrating Conditions")
		}
	}

	return result
}

/////////////

interface OldStreamPlanSegmentConfig {
	id: string
	name: string
	streamInfo?: {
		title?: string
		tags?: string[]
		category?: string
	}
	startAutomation?: OldAutomation
}

interface OldStreamPlanConfig {
	name: string
	startAutomation?: OldAutomation
	endAutomation?: OldAutomation
	segments: OldStreamPlanSegmentConfig[]
}

async function migrateStreamPlan(old: OldStreamPlanConfig) {
	const newConfig: StreamPlanConfig = {
		name: old.name,
		activationAutomation: createInlineAutomation(),
		deactivationAutomation: createInlineAutomation(),
		segments: [],
	}

	if (old.startAutomation) {
		newConfig.activationAutomation.sequence = await migrateOldAutomation(old.startAutomation)
	}

	if (old.endAutomation) {
		newConfig.activationAutomation.sequence = await migrateOldAutomation(old.endAutomation)
	}

	for (const oldSegment of old.segments ?? []) {
		const newSegment: StreamPlanSegment = {
			id: oldSegment.id,
			name: oldSegment.name,
			components: {},
			activationAutomation: createInlineAutomation(),
			deactivationAutomation: createInlineAutomation(),
		}

		if (oldSegment.startAutomation) {
			newSegment.activationAutomation.sequence = await migrateOldAutomation(oldSegment.startAutomation)
		}

		if (oldSegment.streamInfo) {
			newSegment.components["twitch-stream-info"] = {
				title: oldSegment.streamInfo.title,
				category: oldSegment.streamInfo.category,
				tags: oldSegment.streamInfo.tags,
			}
		}

		newConfig.segments.push(newSegment)
	}

	return newConfig
}

///////////

async function checkOldProfiles() {
	try {
		const dir = resolveProjectPath("profiles")
		const files = await fs.readdir(dir)

		for (const file of files) {
			const fullPath = path.join(dir, file)

			const data = await loadYAML(fullPath)

			if (data.name == null) {
				return true
			}
		}

		return false
	} catch (err) {
		return false
	}
}

async function checkOldAutomations() {
	try {
		const dir = resolveProjectPath("automations")
		const files = await fs.readdir(dir)

		for (const file of files) {
			const fullPath = path.join(dir, file)

			const data = await loadYAML(fullPath)

			if (data.name == null) {
				return true
			}
		}

		return false
	} catch (err) {
		return false
	}
}

let migratingOld = false

export async function needsOldMigration() {
	try {
		if (await checkOldProfiles()) return true
		if (await checkOldAutomations()) return true
		return false
	} catch (err) {
		return false
	}
}

let oldSettings: any = {}
let oldSecrets: any = {}

export async function migrateAllOldAutomations() {
	if (!migratingOld) return

	logger.log("Settings Migration Complete")
	rendererMigrateSettingsComplete()

	await migrationFinishLatch?.promise

	const dir = resolveProjectPath("automations")
	const files = await fs.readdir(dir)

	for (const file of files) {
		const fullPath = path.join(dir, file)
		const data = await loadYAML(fullPath)
		const name = path.basename(file, ".yaml")

		const newId = nanoid()
		const newSeq = await migrateOldAutomation(data)

		const newAutomationData: AutomationConfig = {
			name,
			sequence: newSeq,
			floatingSequences: [],
		}

		await writeYAML(newAutomationData, path.join(dir, `${newId}.yaml`))
		await fs.unlink(fullPath)
	}
}

export async function migrateAllOldProfiles() {
	const dir = resolveProjectPath("profiles")
	const files = await fs.readdir(dir)

	for (const file of files) {
		const fullPath = path.join(dir, file)
		const data = await loadYAML(fullPath)
		const name = path.basename(file, ".yaml")

		const newId = nanoid()
		try {
			const newProfileConfig = await migrateOldProfile(name, data)

			await writeYAML(newProfileConfig, path.join(dir, `${newId}.yaml`))
			await fs.unlink(fullPath)
		} catch (err) {
			logger.error("Error Migrating Profile", name)
		}
	}
}

export async function migrateAllOldStreamPlans() {
	const dir = resolveProjectPath("streamplans")
	const newDir = resolveProjectPath("stream-plans")
	await ensureDirectory(newDir)

	const files = await fs.readdir(dir)

	for (const file of files) {
		const fullPath = path.join(dir, file)
		const data = await loadYAML(fullPath)

		const id = path.basename(fullPath, ".yaml")

		try {
			const newConfig = await migrateStreamPlan(data)
			await writeYAML(newConfig, path.join(newDir, `${id}.yaml`))
		} catch (err) {
			logger.error("Error Migrating Stream Plan", err)
		}

		await fs.unlink(fullPath)
	}

	await fs.rm(dir, { recursive: true, force: true })
}

const rendererNeedsMigrate = defineCallableIPC<() => any>("oldMigration", "needsMigrate")
let migrationStartLatch: DelayedResolver<void> | undefined = undefined
const rendererMigrateBackupComplete = defineCallableIPC<() => any>("oldMigration", "migrateBackupComplete")
const rendererMigrateSettingsComplete = defineCallableIPC<() => any>("oldMigration", "migrateSettingsComplete")
let migrationFinishLatch: DelayedResolver<void> | undefined = undefined
const rendererMigrateProfilesComplete = defineCallableIPC<() => any>("oldMigration", "migrateProfilesComplete")

defineIPCFunc("oldMigration", "needsMigrate", () => {
	return migratingOld
})

defineIPCFunc("oldMigration", "beginMigrate", () => {
	migrationStartLatch?.resolve()
})

defineIPCFunc("oldMigration", "finishMigrate", () => {
	migrationFinishLatch?.resolve()
})

async function createBackup() {
	const backupPath = resolveProjectPath("../backup_04.zip")

	if (fsSync.existsSync(backupPath)) {
		//Backup already exists, don't overwrite
		return
	}

	logger.log("Creating Backup")

	const outStream = fsSync.createWriteStream(backupPath)

	const closePromise = new Promise<void>((resolve, reject) => {
		outStream.once("close", () => {
			resolve()
		})
	})

	const archive = archiver("zip", { zlib: { level: 9 } })

	//@ts-ignore
	archive.pipe(outStream)

	function archiveDir(dir: string) {
		const dirpath = resolveProjectPath(dir)
		if (fsSync.existsSync(dirpath)) {
			archive.directory(dirpath, dir)
		}
	}

	function archiveFile(file: string) {
		const filepath = resolveProjectPath(file)
		if (fsSync.existsSync(filepath)) {
			archive.file(filepath, { name: file })
		}
	}

	archiveDir("automations")
	archiveDir("cache")
	archiveDir("discordhooks")
	archiveDir("overlays")
	archiveDir("profiles")
	archiveDir("secrets")
	archiveDir("streamplans")

	archiveFile("settings.yaml")
	archiveFile("state.yaml")
	archiveFile("variables.yaml")
	archiveFile("firstrun.txt")

	archive.finalize()

	await closePromise
}

export async function checkMigration() {
	migratingOld = await needsOldMigration()

	if (migratingOld) {
		oldSettings = await loadYAML(resolveProjectPath("settings.yaml"))
		oldSecrets = await loadYAML(resolveProjectPath("secrets", "secrets.yaml"))

		migrationStartLatch = createDelayedResolver()
		migrationFinishLatch = createDelayedResolver()

		rendererNeedsMigrate()

		await migrationStartLatch.promise

		try {
			await createBackup()
		} catch (err) {
			logger.error("Error Creating Backup!", err)
		}

		rendererMigrateBackupComplete()
	}
}

async function safeDelete(...pathparts: string[]) {
	const fullpath = resolveProjectPath(...pathparts)
	if (fsSync.existsSync(fullpath)) {
		await fs.unlink(fullpath)
	}
}

export async function finishMigration() {
	if (!migratingOld) return

	//Migrate profiles
	await migrateAllOldProfiles()

	await migrateAllOldStreamPlans()

	await safeDelete("combined.log")
	await safeDelete("error.log")
	await safeDelete("firstrun.txt")

	migratingOld = false

	rendererMigrateProfilesComplete()
}

export async function migratePlugin(pluginId: string) {
	if (!migratingOld) return

	for (const oldPlugin of Object.keys(settingsMigrators)) {
		const migrator = settingsMigrators[oldPlugin]
		if (migrator.plugin == pluginId) {
			try {
				const { settings, secrets } = await migrator.migrateSettings(
					oldSettings[oldPlugin] ?? {},
					oldSecrets[oldPlugin] ?? {}
				)

				await writeYAML(settings, "settings", `${migrator.plugin}.yaml`)
				await writeSecretYAML(secrets, "secrets", `${migrator.plugin}.yaml`)
			} catch (err) {
				logger.error("Error Migrating", pluginId, err)
			}
			break
		}
	}
}

//////////////////////////////////////
