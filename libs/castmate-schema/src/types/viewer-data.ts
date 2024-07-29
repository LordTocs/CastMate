import { IPCSchema, Schema } from "../schema"

export interface ViewerVariable {
	name: string
	schema: Schema
}

export interface IPCViewerVariable {
	name: string
	schema: IPCSchema
}
