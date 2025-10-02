import { IPCSchema, Schema } from "../schema"

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
