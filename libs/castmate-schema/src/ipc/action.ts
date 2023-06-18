import { Color } from "../data/color"
import { IPCSchema } from "../schema"

export interface IPCActionDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon?: string
	readonly color?: Color

	readonly config: IPCSchema
	readonly result?: IPCSchema
}
