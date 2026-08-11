import { ExpressionNode } from "../expression/expression"
import { ResourceData, ResourceSpecification } from "../plugins/resources"
import { Defaultable, defineSchemaType, getDefault, S, Schema, SchemaBaseOptions } from "./schema-base"
import { TSchemaFunctionSet } from "./schema-function"
import { TSchemaProperties } from "./schema-object"
import { SchemaType } from "./schema-typing"

export interface SchemaResourceOptions<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet
> extends SchemaBaseOptions,
		Defaultable<ResourceData<TState, TConfig, TFunctions>> {
	resource: ResourceSpecification<TState, TConfig, TFunctions>
}

export interface SchemaResource<
	TState extends TSchemaProperties = TSchemaProperties,
	TConfig extends TSchemaProperties = TSchemaProperties,
	TFunctions extends TSchemaFunctionSet = TSchemaFunctionSet
> extends Schema,
		SchemaResourceOptions<TState, TConfig, TFunctions> {
	type: "Resource"
}

declare module "./schema-base" {
	namespace S {
		function Resource<
			TState extends TSchemaProperties,
			TConfig extends TSchemaProperties,
			TFunctions extends TSchemaFunctionSet
		>(options: SchemaResourceOptions<TState, TConfig, TFunctions>): SchemaResource<TState, TConfig, TFunctions>
	}

	interface SchemaTypeMap {
		Resource: SchemaMapping<SchemaResource, ResourceData<TSchemaProperties, TSchemaProperties, TSchemaFunctionSet>>
	}
}

export type SchemaResourceType<TSchemaResource extends SchemaResource> = ResourceData<
	TSchemaResource["resource"]["state"]["properties"],
	TSchemaResource["resource"]["config"]["properties"],
	TSchemaResource["resource"]["functions"]
>

export type ExpressedSchemaResourceType<TSchemaResource extends SchemaResource> =
	| SchemaResourceType<TSchemaResource>
	| ExpressionNode

S.Resource = (options) => {
	return {
		type: "Resource",
		...options,
	}
}

defineSchemaType<SchemaResource>({
	type: "Resource",
	name: "Resource",
	color: "#000000",
	icon: "mdi mdi-star",
	traits: {
		canBeVariable: true,
		canBeViewerVariable: true,
	},
	async constructDefault(schema) {
		return (await getDefault(schema)) as SchemaType<typeof schema>
	},
})
