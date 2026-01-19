import { ExpressionNode } from "../expression/expression"
import { SchemaArray, ResolvedSchemaArrayType, UnresolvedSchemaArrayType } from "./schema-array"
import { Schema, SchemaMapping, SchemaTypeMap } from "./schema-base"
import { SchemaObject, UnresolvedSchemaObjectType, ResolvedSchemaObjectType } from "./schema-object"

type ExtractSchemaTypes<T extends SchemaMapping> = T["schema"]

type SchemaTypeMapping = {
	[key: PropertyKey]: SchemaMapping<any, any, any>
}

type GetTypeMapping<
	T extends Schema,
	Mapping extends Record<keyof Mapping, SchemaMapping<any, any, any>>
> = T["type"] extends keyof Mapping ? Mapping[T["type"]] : never

type Fallback<T, F> = T extends never ? F : T

export type SchemaByName<Name extends keyof SchemaTypeMap> = SchemaTypeMap[Name]["schema"]

export type UnresolvedSchemaTypeByName<T extends keyof SchemaTypeMap> = Fallback<
	SchemaTypeMap[T]["unresolvedType"],
	SchemaTypeMap[T]["resolvedType"] | ExpressionNode
>

export type UnresolvedSchemaType<TSchema extends Schema> = TSchema extends SchemaObject
	? UnresolvedSchemaObjectType<TSchema>
	: TSchema extends SchemaArray
	? UnresolvedSchemaArrayType<TSchema>
	: Fallback<
			GetTypeMapping<TSchema, SchemaTypeMap>["unresolvedType"],
			GetTypeMapping<TSchema, SchemaTypeMap>["resolvedType"] | ExpressionNode
	  >

export type ResolvedSchemaType<TSchema extends Schema> = TSchema extends SchemaObject
	? ResolvedSchemaObjectType<TSchema>
	: TSchema extends SchemaArray
	? ResolvedSchemaArrayType<TSchema>
	: GetTypeMapping<TSchema, SchemaTypeMap>["resolvedType"]

export type ResolvedSchemaTypeByName<T extends keyof SchemaTypeMap> = SchemaTypeMap[T]["resolvedType"]

/////

// SerializedSchemaType -> Type that can contain expressions and is serialized to disk ??
// ExpressedSchemaType -> Type that can contain expressions (used to be templates)
// RemoteSchemaType -> Type with resolved expressions that can be sent to remote and still resolve things like timers
// SchemaType -> Type with resolved expressions and resolved remotes

// ExposedType -> Type with things like TwitchViewers resolved. Do we need this anymore?
// We can use expressions to access cached properties / vars of the viewer
