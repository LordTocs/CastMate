import { Color } from "../data/color"
import { IPCSchema } from "../schema"

export type ActionType = "instant" | "time" | "time-indefinite" | "flow"

export interface IPCActionDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon?: string
	readonly color?: Color
	readonly type: ActionType
	readonly durationHandler?: string

	readonly config: IPCSchema
	readonly result?: IPCSchema
}
