import { Sequence, TimeAction, Toggle } from "castmate-schema"
import { PluginManager } from "../plugins/plugin-manager"

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

const actionOverrides: Record<string, Record<string, { plugin: string; action: string }>> = {
	castmate: {
		delay: { plugin: "time", action: "delay" },
	},
}

function migrateOldLightColor(hbsk: {
	hue?: number | string
	sat?: number | string
	bri?: number | string
	temp?: number
	mode: "color" | "temp"
}) {}

async function migrateActionConfig(oldAction: OldAction) {
	return {}
}

async function migrateOldAutomation(oldAutomation: OldAutomation): Promise<Sequence> {
	let oldOffsetTime = 0
	let newTimeBase: TimeAction | undefined

	const result: Sequence = {
		actions: [],
	}

	for (const oldAction of oldAutomation.actions) {
		const pluginKey = actionOverrides[oldAction.plugin]?.[oldAction.action]?.plugin ?? oldAction.plugin
		const actionKey = actionOverrides[oldAction.plugin]?.[oldAction.action]?.plugin ?? oldAction.action

		const action = PluginManager.getInstance().getAction(pluginKey, actionKey)

		const newConfig = await migrateActionConfig(oldAction)

		const newIsInstant = true

		if (newIsInstant) {
		} else {
			//New is timed
		}

		if (oldAction.plugin == "castmate") {
			if (oldAction.action == "timestamp") {
				oldOffsetTime = Math.max(oldOffsetTime, oldAction.data as number)
			} else {
				oldOffsetTime += Math.max(0, oldAction.data as number)
			}
		}
	}

	return result
}
