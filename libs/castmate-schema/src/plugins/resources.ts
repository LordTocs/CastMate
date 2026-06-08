import { S, Schema } from "../schema/schema-base"
import { AsyncSchemaFunctionSetType, SchemaFunction, TSchemaFunctionSet } from "../schema/schema-function"
import { SchemaObject, TSchemaProperties } from "../schema/schema-object"
import { SchemaType } from "../schema/schema-typing"
import { PluginBaseSpecification, testPlugin } from "./plugins"

export interface ResourceSpecification<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet
> {
	plugin: string
	id: string
	subId?: string
	state: SchemaObject<TState>
	config: SchemaObject<TConfig>
	functions: TFunctions
}

interface ResourceDesc<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet = {}
> {
	id: string
	state: TState
	config: TConfig
	functions?: TFunctions
}

export interface ResourceConstructionData<TState extends TSchemaProperties, TConfig extends TSchemaProperties> {
	id: string
	name: string
	state: SchemaType<SchemaObject<TState>>
	readonly config: SchemaType<SchemaObject<TConfig>>
}

export interface ResourceDataBase<TState extends TSchemaProperties, TConfig extends TSchemaProperties>
	extends ResourceConstructionData<TState, TConfig> {
	plugin: string
	typeId: string
}

export type ResourceData<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet
> = ResourceDataBase<TState, TConfig> & AsyncSchemaFunctionSetType<TFunctions>

export type Resource<TSpec extends ResourceSpecification<TSchemaProperties, TSchemaProperties, TSchemaFunctionSet>> =
	TSpec extends ResourceSpecification<infer TState, infer TConfig, infer TFunctions>
		? ResourceData<TState, TConfig, TFunctions>
		: never

export function defineResource<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet = {}
>(
	plugin: PluginBaseSpecification,
	desc: ResourceDesc<TState, TConfig, TFunctions>
): ResourceSpecification<TState, TConfig, TFunctions> {
	return {
		plugin: plugin.id,
		id: desc.id,
		state: S.Object(desc.state),
		config: S.Object(desc.config),
		//@ts-expect-error
		functions: desc.functions ?? {},
	}
}

interface ResourceExtensionDesc<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet
> {
	subId: string
	state: TState
	config: TConfig
	functions?: TFunctions
}

export function extendResource<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TParentState extends TSchemaProperties,
	TParentConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet = {},
	TParentFunctions extends TSchemaFunctionSet = {}
>(
	parent: ResourceSpecification<TParentState, TParentConfig, TParentFunctions>,
	desc: ResourceExtensionDesc<TState, TConfig, TFunctions>
) {
	const result: ResourceSpecification<TParentState & TState, TParentConfig & TConfig, TParentFunctions & TFunctions> =
		{
			plugin: parent.plugin,
			id: parent.id,
			subId: desc.subId,
			state: S.Object({
				...parent.state.properties,
				...desc.state,
			}),
			config: S.Object({
				...parent.config.properties,
				...desc.config,
			}),
			//@ts-expect-error
			functions: {
				...parent.functions,
				...desc.functions,
			},
		}

	return result
}

const ResourceNameSchema = S.String()

export const testRes = defineResource(testPlugin, {
	id: "test",
	state: {
		a: S.Number(),
	},
	config: {
		b: S.String(),
		c: S.Optional(S.Boolean()),
	},
	functions: {
		testFunc: S.Function(S.String(), [S.Number(), S.String()]),
	},
})

export const testRes3 = defineResource(testPlugin, {
	id: "test2",
	state: {
		a: S.Number(),
	},
	config: {
		b: S.Directory(),
	},
})

const testExtRes = extendResource(testRes, {
	subId: "testExt",
	state: {
		b: S.Optional(S.String()),
	},
	config: {},
})
