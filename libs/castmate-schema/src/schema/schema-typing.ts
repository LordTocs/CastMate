import { ExpressionNode } from "../expression/expression"
import { SchemaArray, SchemaArrayType, ExpressedSchemaArrayType } from "./schema-array"
import { Schema, SchemaMapping, SchemaTypeMap } from "./schema-base"
import { SchemaObject, ExpressedSchemaObjectType, SchemaObjectType } from "./schema-object"
import { ExpressedSchemaRangeType, SchemaRange, SchemaRangeType } from "./schema-range"

type GetTypeMapping<
	T extends Schema,
	Mapping extends Record<keyof Mapping, SchemaMapping<any, any, any>>
> = T["type"] extends keyof Mapping ? Mapping[T["type"]] : never

type Fallback<T, F> = T extends never ? F : T

export type SchemaByName<Name extends keyof SchemaTypeMap> = SchemaTypeMap[Name]["schema"]

export type ExpressedSchemaTypeByName<T extends keyof SchemaTypeMap> = Fallback<
	SchemaTypeMap[T]["expressedType"],
	SchemaTypeMap[T]["type"] | ExpressionNode
>

export type ExpressedSchemaType<TSchema extends Schema> = TSchema extends SchemaObject
	? ExpressedSchemaObjectType<TSchema>
	: TSchema extends SchemaArray
	? ExpressedSchemaArrayType<TSchema>
	: TSchema extends SchemaRange
	? ExpressedSchemaRangeType<TSchema>
	: Fallback<
			GetTypeMapping<TSchema, SchemaTypeMap>["expressedType"],
			GetTypeMapping<TSchema, SchemaTypeMap>["type"] | ExpressionNode
	  >

export type SchemaType<TSchema extends Schema> = TSchema extends SchemaObject
	? SchemaObjectType<TSchema>
	: TSchema extends SchemaArray
	? SchemaArrayType<TSchema>
	: TSchema extends SchemaRange
	? SchemaRangeType<TSchema>
	: GetTypeMapping<TSchema, SchemaTypeMap>["type"]

// export type SchemaType<
// 	TSchema extends Schema,
// 	Result extends unknown = TSchema extends SchemaObject
// 		? SchemaObjectType<TSchema>
// 		: TSchema extends SchemaArray
// 		? SchemaArrayType<TSchema>
// 		: TSchema extends SchemaRange
// 		? SchemaRangeType<TSchema>
// 		: GetTypeMapping<TSchema, SchemaTypeMap>["type"]
// > = Result

export type SchemaTypeByName<T extends keyof SchemaTypeMap> = SchemaTypeMap[T]["type"]

/////

// SerializedSchemaType -> Type that can contain expressions and is serialized to disk ??
// ExpressedSchemaType -> Type that can contain expressions (used to be templates)
// RemoteSchemaType -> Type with resolved expressions that can be sent to remote and still resolve things like timers
// SchemaType -> Type with resolved expressions and resolved remotes

// ExposedType -> Type with things like TwitchViewers resolved. Do we need this anymore?
// We can use expressions to access cached properties / vars of the viewer
