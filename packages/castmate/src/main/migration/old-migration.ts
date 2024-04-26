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
import { Automation, PluginManager, ResourceRegistry, usePluginLogger } from "castmate-core"
import { nanoid } from "nanoid/non-secure"
import { LightColor } from "castmate-plugin-iot-shared"
import { TwitchViewer, TwitchViewerUnresolved } from "castmate-plugin-twitch-shared"
import { ChannelPointReward, TwitchAccount } from "castmate-plugin-twitch-main"
import { OBSBoundsType, OBSSourceTransform } from "castmate-plugin-obs-shared"

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

function defaultStringIsTemplate(value: any | string) {
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

const actionOverrides: Record<string, Record<string, { plugin: string; action: string }>> = {
	castmate: {
		delay: { plugin: "time", action: "delay" },
	},
	twitch: {},
}

function migrateTemplateStr<T>(template: T | string | undefined) {
	return template
}

function migrateResourceId(id: string | undefined) {
	return id
}

////////MIGRATE TWITCH//////////////

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

/// OBS ACTIONS

function migrateDefaultOBS() {
	return ""
}

async function migrateOBSSource(scene: string, sourceName: string) {
	return 0
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
	temp?: number
	mode: "color" | "temp"
}

function migrateOldLightColor(hbsk: OldHbsk | undefined): LightColor | undefined {
	if (!hbsk) return undefined

	if (hbsk.mode == "color") {
		return `hsb(${migrateTemplateStr(hbsk.hue) ?? 0}, ${migrateTemplateStr(hbsk.sat) ?? 0}, ${
			migrateTemplateStr(hbsk.bri) ?? 0
		})` as LightColor
	} else {
		return `kb(${migrateTemplateStr(hbsk.temp) ?? 0}, ${migrateTemplateStr(hbsk.bri) ?? 0})` as LightColor
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

registerOldActionMigrator("spellcast", "spellHook", {
	plugin: "spellcast",
	action: "spellHook",
	migrateConfig(oldConfig: { hookId: string }) {
		return {
			spell: migrateResourceId(oldConfig.hookId),
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

//////////////////////////////////////

const logger = usePluginLogger("migrate")

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
			} else {
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

export async function testMigrate() {
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
