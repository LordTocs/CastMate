import { PluginBaseSpecification, testPlugin } from "../plugins/plugins"
import { Schema, S, SchemaMeta } from "../schema/schema-base"
import { SchemaObject, TSchemaProperties } from "../schema/schema-object"
import { ExpressedSchemaType, SchemaType, ExpressedSchemaArgTypes } from "../schema/schema-typing"

export interface ExpressionNodeSpecification<
	TOutput extends Schema,
	TOperands extends Schema[],
	TConfig extends TSchemaProperties
> {
	id: string
	plugin: string
	output: TOutput
	operands: TOperands
	config: SchemaObject<TConfig>
}

export interface ExpressionNodeDesc<
	TOutput extends Schema,
	TOperands extends Schema[],
	TConfig extends TSchemaProperties
> {
	id: string
	output: TOutput
	operands: [...TOperands]
	config: TConfig
}

export function defineExpressionNode<
	TOutput extends Schema,
	TOperands extends Schema[],
	TConfig extends TSchemaProperties
>(
	plugin: PluginBaseSpecification,
	desc: ExpressionNodeDesc<TOutput, TOperands, TConfig>
): ExpressionNodeSpecification<TOutput, TOperands, TConfig> {
	return {
		id: desc.id,
		plugin: plugin.id,
		output: desc.output,
		operands: desc.operands,
		config: S.Object(desc.config),
	}
}

export namespace E {
	export function VariardicArgs<TSchema extends Schema>(type: TSchema) {
		return {
			...S.Array(type),
			variardic: true,
		}
	}
}

export const testExpr = defineExpressionNode(testPlugin, {
	id: "test",
	output: S.String(),
	config: {},
	operands: [S.Timer(), E.VariardicArgs(S.String())],
})

//--- Actual Expression Data

export interface ExpressionNode<TOperands extends Schema[] = Schema[], TConfig extends TSchemaProperties = {}> {
	plugin: string
	id: string
	config?: SchemaType<SchemaObject<TConfig>>
	operands?: ExpressedSchemaArgTypes<TOperands>
}

export function isExpressionNode(value: unknown): value is ExpressionNode {
	if (!value) return false
	if (typeof value != "object") return false
	if (!("plugin" in value)) return false
	if (!("id" in value)) return false
	return true
}

export interface ExpressionContext {
	[key: string]: any
}
