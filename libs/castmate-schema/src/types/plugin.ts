import { Schema, SchemaObj } from "../schema"

export interface ActionTypeData {
	id: string
	name: string
	description: string
	icon: string
	config: SchemaObj
	color: string
	type: "instant" | "time-indefinite" | "time" | "flow"
}

export interface TriggerTypeData {
	id: string
	name: string
	description: string
	icon: string
	config: SchemaObj
	color: string
}

export interface PluginData {
	id: string
	name: string
	icon: string
	color: string
	actions: {
		[id: string]: ActionTypeData
	}
	triggers: {
		[id: string]: TriggerTypeData
	}
}
