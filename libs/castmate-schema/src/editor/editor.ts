import { Schema } from "../schema/schema-base"
import { SchemaFunction } from "../schema/schema-function"
import { DataDiff } from "../util/diff"

export interface EditorFunctionSpec<TFunction extends SchemaFunction = SchemaFunction> {
	plugin: string
	id: string
	schema: TFunction
}

/**
 * Editor functions are functions the editor can call that run on the main process of castmate
 */
export function defineEditorFunction<TFunction extends SchemaFunction>(plugin: string, id: string, schema: TFunction) {
	return {
		plugin,
		id,
		schema,
	} as EditorFunctionSpec<TFunction>
}

export interface EditorEventSpec<TArgs extends Schema[]> {
	plugin: string
	id: string
	schema: [...TArgs]
}

/**
 * Editor events are UI side events triggered by the main process
 */
export function defineEditorEvent<TArgs extends Schema[]>(plugin: string, id: string, args: [...TArgs]) {
	return {
		plugin,
		id,
		schema: args,
	} as EditorEventSpec<TArgs>
}

export interface RawEditorEventSpec<TFunc extends (...args: any[]) => void> {
	plugin: string
	id: string
}

export function defineRawEditorEvent<TFunc extends (...args: any[]) => void>(plugin: string, id: string) {
	return {
		plugin,
		id,
	} as RawEditorEventSpec<TFunc>
}

export interface RawEditorFunctionSpec<TFunc extends (...args: any[]) => any> {
	plugin: string
	id: string
}

export function defineRawEditorFunction<TFunc extends (...args: any[]) => any>(plugin: string, id: string) {
	return {
		plugin,
		id,
	} as RawEditorFunctionSpec<TFunc>
}

export interface ViewData {
	data: Record<PropertyKey, any>
	subPaths: Record<PropertyKey, ViewData>
}

export interface EditStack {
	undoStack: DataDiff[]
	redoStack: DataDiff[]
}

export interface DataListSelection {
	type: "list"
	ids: string
}

export interface DataRangeSelection {
	type: "range"
	startIndex: number
	length: number
}

export type DocumentSelection = DataListSelection | DataRangeSelection

export interface DataEditUser {
	focusPath: string
	selection: DocumentSelection
}

export interface DataEditor {
	data: Record<PropertyKey, any>
	view: ViewData
	editStack: EditStack
	editingUsers: Map<string, DataEditUser>
}
