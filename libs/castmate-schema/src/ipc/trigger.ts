import { Color } from "../data/color"
import { IPCSchema } from "../schema"

export interface IPCTriggerDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon?: string
	readonly color: Color
	readonly version: string

	readonly config: IPCSchema
	readonly context: IPCSchema
}
