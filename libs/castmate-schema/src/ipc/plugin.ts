import { Color } from "../data/color"
import { IPCActionDefinition } from "./action"
import { IPCTriggerDefinition } from "./trigger"

export interface IPCPluginDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon: string
	readonly color: Color
	readonly version: string

	actions: Record<string, IPCActionDefinition>
	triggers: Record<string, IPCTriggerDefinition>
	//TODO: Map<string, IPCStateDefinition>
}
