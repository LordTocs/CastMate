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

	actions: Map<string, IPCActionDefinition>
	triggers: Map<string, IPCTriggerDefinition>
	//TODO: Map<string, IPCStateDefinition>
}
