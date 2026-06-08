import { Schema } from "../schema/schema-base"
import { SchemaFunction } from "../schema/schema-function"

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
