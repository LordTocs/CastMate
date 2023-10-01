import { Color } from "../data/color"
import { IPCSchema } from "../schema"
import { IPCActionDefinition } from "./action"
import { IPCTriggerDefinition } from "./trigger"

export interface IPCValueSetting {
	type: "value"
	schema: IPCSchema
	value: any
}

export interface IPCResourceSetting {
	type: "resource"
	resourceId: string
	name: string
	description?: string
}

export type IPCSettingsDefinition = IPCValueSetting | IPCResourceSetting

export interface IPCPluginDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon: string
	readonly color: Color
	readonly version: string

	actions: Record<string, IPCActionDefinition>
	triggers: Record<string, IPCTriggerDefinition>
	settings: Record<string, IPCSettingsDefinition>
	//TODO: Map<string, IPCStateDefinition>
}
