import { IPCSchema, registerType, Schema, SchemaBase } from "../schema"

export interface ViewerVariable {
	name: string
	schema: Schema
}

export interface IPCViewerVariable {
	name: string
	schema: IPCSchema
}

//Kind of bad to hard code these provider
export interface ViewerDataRow {
	[varName: string]: any
}

export interface ViewerDataObserver {
	onNewViewerData(provider: string, id: string, viewerData: ViewerDataRow): any
	onViewerDataChanged(provider: string, id: string, varName: string, value: any): any
	onViewerDataRemoved(provider: string, id: string): any
	onNewViewerVariable(variable: ViewerVariable): any
	onViewerVariableDeleted(variable: string): any
}

export interface ViewerDataProvider {
	observeViewerData(observer: ViewerDataObserver): ViewerDataObserver
	unobserveViewerData(observer: ViewerDataObserver): void
	queryViewerData(
		start: number,
		end: number,
		sortBy: string | undefined,
		sortOrder: number | undefined
	): Promise<ViewerDataRow[]>
}

export type ViewerVariableName = string

export const ViewerVariableNameSymbol = Symbol()
export const ViewerVariableName = {
	[ViewerVariableNameSymbol]: "ViewerVariableName",
	factoryCreate() {
		return ""
	},
}
export type ViewerVariableNameFactory = typeof ViewerVariableName

export interface SchemaViewerVariableName extends SchemaBase<ViewerVariableName> {
	type: ViewerVariableNameFactory
}

declare module "../schema" {
	interface SchemaTypeMap {
		ViewerVariableName: [SchemaViewerVariableName, ViewerVariableName]
	}
}

registerType("ViewerVariableName", {
	constructor: ViewerVariableName,
	icon: "mdi mdi-text-short",
	canBeVariable: false,
	canBeViewerVariable: false,
})
