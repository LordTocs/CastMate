import { cloneDeep, isFunction } from "lodash"
import { MaybePromise, MapToUnion, Modify, Fallback } from "./util/type-helpers"
import { ValueCompareOperator } from "./data/boolean-expression"
import { RemoteTemplateString } from "./template/template-utils"

////////////////////////////////////// ENUMs /////////////////////////////////////////////
export interface EnumPair<T> {
	value: T
	name: string
}

//Enum arrays or functions can either just be the type, or a pair to label the value

export type EnumItem<T> = T | EnumPair<T>

//TODO: Can we type context?
export interface Enumable<T> {
	enum?: Array<EnumItem<T>> | (() => Promise<Array<EnumItem<T>>>) | ((context: any) => Promise<Array<EnumItem<T>>>)
}

export interface Defaultable<T> {
	default?: T | (() => MaybePromise<T>)
}

//Base type of all schema types
export interface SchemaBase<T = any> extends Defaultable<T> {
	name?: string
	required?: boolean
}

//Declare our type registry up here so we can use it
const dataNameLookup: Map<string, FullDataTypeMetaData> = new Map()
const dataConstructorLookup: Map<DataConstructorOrFactory, FullDataTypeMetaData> = new Map()

///////////////////////////////////Built in Schemas/////////////////////////////////////

export interface SchemaNumber extends Enumable<number>, SchemaBase<number> {
	type: NumberConstructor
	min?: number
	max?: number
	step?: number
	slider?: boolean
	unit?: string
	template?: boolean
}

export type TemplateNumber = number | string
registerType("Number", {
	constructor: Number,
	validate(value: number | string | undefined, schema: SchemaNumber) {
		if (typeof value == "string") {
			if (!schema.template) return `${schema.name} cannot be a template value`
			return undefined
		}

		if (value == null) {
			if (schema.required) return `${schema.name} is required`
			return undefined
		}

		if (schema.min != null && value < schema.min) {
			return `${schema.name} must be at least ${schema.min}`
		}

		if (schema.max != null && value > schema.max) {
			return `${schema.name} must be less than ${schema.max}`
		}

		return undefined
	},
	async fromString(str: string) {
		const num = Number(str)
		if (isNaN(num)) return undefined
		return num
	},
	canBeCommandArg: true,
})

export interface SchemaString extends Enumable<string>, SchemaBase<string> {
	type: StringConstructor
	template?: boolean
	maxLength?: number
}

registerType("String", {
	constructor: String,
	validate(value: string | undefined, schema: SchemaString) {
		if (value == null) {
			if (schema.required) return `${schema.name} is required`
			return undefined
		}

		if (schema.maxLength != null && !schema.template) {
			if (value.length > schema.maxLength) {
				return `${schema.name} can only be ${schema.maxLength} characters long`
			}
		}

		return undefined
	},
	async fromString(value) {
		return value
	},
	canBeCommandArg: true,
})

export interface SchemaBoolean extends SchemaBase<boolean> {
	type: BooleanConstructor
	trueIcon?: string
	falseIcon?: string
}

registerType("Boolean", {
	constructor: Boolean,
})

export interface SchemaObj extends SchemaBase<object> {
	type: ObjectConstructor
	properties: Record<string, Schema>
}

export interface SchemaArray extends SchemaBase<Array<any>> {
	type: ArrayConstructor
	items: Schema
}

///////////////////////////////Resources////////////////////////////////////////////

interface ResourceType {
	id: string
}
type ResourceTypeConstructor = { new (...args: any[]): ResourceType }

//Match resource constructors
export interface SchemaResource extends SchemaBase {
	type: ResourceTypeConstructor
	filter?: Record<string, any>
}

type SchemaResourceType<T extends SchemaResource> = InstanceType<T["type"]>

/////////////////////////////////////////////////////////////////////////////////////

//Must be exported for interface merging to work

// This interface maps the Schema type to the desired runtime type
export interface SchemaTypeMap {
	string: [SchemaString, string]
	number: [SchemaNumber, number]
	boolean: [SchemaBoolean, boolean]
}

type SchemaTypeUnion = MapToUnion<SchemaTypeMap>
type SchemaTypes = SchemaTypeUnion[0]

export type Schema = SchemaTypes | SchemaObj | SchemaArray | SchemaResource

export type SchemaTypeByConstructor<T extends DataConstructorOrFactory> = Extract<
	SchemaTypeUnion,
	T extends infer ConstructorOrFactory ? [{ type: ConstructorOrFactory }, any] : [never, any]
>[0]
//Extracts the type for a Schema out of SchemaTypeMap
type SchemaPropType<T extends Schema> = Extract<
	SchemaTypeUnion,
	T extends { type: infer ConstructorOrFactory } ? [{ type: ConstructorOrFactory }, any] : [never, any]
>[1]

type SchemaObjType<T extends SchemaObj> = {
	[Property in keyof T["properties"]]: SchemaType<T["properties"][Property]>
}

type SchemaArrayType<T extends SchemaArray> = Array<SchemaType<T["items"]>>

//Makes a type optional if its schema doesn't have required set to true
type SchemaApplyRequired<SchemaT extends Schema, T> = SchemaT["required"] extends true ? T : T | undefined

interface MaybeTemplated {
	template?: boolean
}
type SchemaApplyTemplate<SchemaT extends Schema> = SchemaT extends MaybeTemplated
	? SchemaT["template"] extends true
		? TemplateSchemaPropType<SchemaT>
		: SchemaPropType<SchemaT>
	: SchemaPropType<SchemaT>

//Converts a schema into the type it will be at runtime
export type SchemaType<T extends Schema> = T extends SchemaObj
	? SchemaObjType<T>
	: SchemaApplyRequired<
			T,
			T extends SchemaArray
				? SchemaArrayType<T>
				: T extends SchemaResource
				? SchemaResourceType<T>
				: SchemaApplyTemplate<T>
	  >

///////////////////////////////Resolved Schema Types////////////////////////////////////////////
// Resolved Schema Types are types that have had templates applied. This is how templates are
// applied automatically. This way handler functions don't need to manually apply templating

type ResolvedSchemaObjType<T extends SchemaObj> = {
	[Property in keyof T["properties"]]: ResolvedSchemaType<T["properties"][Property]>
}

type ResolvedSchemaArrayType<T extends SchemaArray> = Array<ResolvedSchemaType<T["items"]>>

export type ResolvedSchemaType<T extends Schema> = T extends SchemaObj
	? ResolvedSchemaObjType<T>
	: SchemaApplyRequired<
			T,
			T extends SchemaArray
				? ResolvedSchemaArrayType<T>
				: T extends SchemaResource
				? SchemaResourceType<T>
				: SchemaPropType<T>
	  >

export type ResolvedTypeByConstructor<T extends DataConstructorOrFactory> = Fallback<
	Extract<
		SchemaTypeUnion,
		T extends infer ConstructorOrFactory ? [{ type: ConstructorOrFactory }, any] : [never, any]
	>[1],
	any
>
///////////////////////////////////Remote Schema Type//////////////////////////////////////////////
//Overrides the Resolved type to an intermediate type to be transmitted and resolved later.
//RemoteSchemaType exists as an intermediate format to transmit templated data. It's main purpose is timers and stopwatches.
//When a timer is templated into a string, instead of templating the final formatted string we format with the timer info.
//Then we can transmit the data and the other side can finish transforming the timer into text and update it as time passes.

export interface RemoteTemplateSchemaTypeMap {
	dummy: [Dummy, Dummy]
	String: [SchemaString, RemoteTemplateString]
}
export type RemoteTemplateSchemaTypeUnion = MapToUnion<RemoteTemplateSchemaTypeMap>

type RemoteSchemaObjType<T extends SchemaObj> = {
	[Property in keyof T["properties"]]: RemoteSchemaType<T["properties"][Property]>
}

type RemoteSchemaArrayType<T extends SchemaArray> = Array<RemoteSchemaType<T["items"]>>

export type RemoteTemplateSchemaPropType<T extends Schema> = Fallback<
	Extract<
		RemoteTemplateSchemaTypeUnion,
		T extends { type: infer ConstructorOrFactory } ? [{ type: ConstructorOrFactory }, any] : [never, any]
	>[1],
	SchemaPropType<T>
>

type SchemaApplyRemoteTemplate<SchemaT extends Schema> = SchemaT extends MaybeTemplated
	? SchemaT["template"] extends true
		? RemoteTemplateSchemaPropType<SchemaT>
		: SchemaPropType<SchemaT>
	: SchemaPropType<SchemaT>

export type RemoteSchemaType<T extends Schema> = T extends SchemaObj
	? RemoteSchemaObjType<T>
	: SchemaApplyRequired<
			T,
			T extends SchemaArray
				? RemoteSchemaArrayType<T>
				: T extends SchemaResource
				? SchemaResourceType<T>
				: SchemaApplyRemoteTemplate<T>
	  >

export type RemoteTemplateTypeByConstructor<T extends DataConstructorOrFactory> = Fallback<
	Extract<
		RemoteTemplateSchemaTypeUnion,
		T extends infer ConstructorOrFactory ? [{ type: ConstructorOrFactory }, any] : [never, any]
	>[1],
	ResolvedTypeByConstructor<T>
>

/////////////////////////////// Template type Map ///////////////////////////////////////////////
//The template type map is used to override the type that holds the pre-template data, by default pre-templated data is a string

export interface TemplateSchemaTypeMap {
	dummy: [Dummy, Dummy]
}

export type TemplateSchemaTypeUnion = MapToUnion<TemplateSchemaTypeMap>

export type TemplateSchemaPropType<T extends Schema> = Fallback<
	Extract<
		TemplateSchemaTypeUnion,
		T extends { type: infer ConstructorOrFactory } ? [{ type: ConstructorOrFactory }, any] : [never, any]
	>[1],
	SchemaPropType<T> | string
>

export type TemplateTypeByConstructor<T extends DataConstructorOrFactory> = Fallback<
	Extract<
		TemplateSchemaTypeUnion,
		T extends infer ConstructorOrFactory ? [{ type: ConstructorOrFactory }, any] : [never, any]
	>[1],
	ResolvedTypeByConstructor<T> | string
>

///////////////////////////////Exposed Schema Types////////////////////////////////////////////

// Exposed schema is a way to transform a type before it gets to the action queue context
// This is primarly for the twitch viewer type. By allowing for expose / unexpose
// We can store and operate on user IDs until it's time to pass the user to the user automations
// At which point we have to resolve all the info about it.

// This lets us cut down on queries, since we don't need to fully resolve a viewer until it's actually stored in state
// or an automation runs on it.

const DummySymbol = Symbol()
interface Dummy {
	[DummySymbol]: boolean
}

export interface ExposedSchemaTypeMap {
	dummy: [Dummy, Dummy]
}

export type ExposedSchemaTypeUnion = MapToUnion<ExposedSchemaTypeMap>

export type ExposedSchemaPropType<T extends Schema> = Fallback<
	Extract<
		ExposedSchemaTypeUnion,
		T extends { type: infer ConstructorOrFactory } ? [{ type: ConstructorOrFactory }, any] : [never, any]
	>[1],
	SchemaPropType<T>
>

type ExposedSchemaArrayType<T extends SchemaArray> = Array<ExposedSchemaType<T["items"]>>

type ExposedSchemaObjType<T extends SchemaObj> = {
	[Property in keyof T["properties"]]: ExposedSchemaType<T["properties"][Property]>
}

export type ExposedSchemaType<T extends Schema> = T extends SchemaObj
	? ExposedSchemaObjType<T>
	: SchemaApplyRequired<
			T,
			T extends SchemaArray
				? ExposedSchemaArrayType<T>
				: T extends SchemaResource
				? SchemaResourceType<T>
				: ExposedSchemaPropType<T>
	  >

export type ExposedTypeByConstructor<T extends DataConstructorOrFactory> = Fallback<
	Extract<
		ExposedSchemaTypeUnion,
		T extends infer ConstructorOrFactory ? [{ type: ConstructorOrFactory }, any] : [never, any]
	>[1],
	ResolvedTypeByConstructor<T>
>

////////////////////////////////////////////////////////////////

//Allows the special case for DynamicType to run. Useful for variable modifying actions and hopefully OBS property changing
export interface DynamicTypable {
	dynamicType(context: any): Promise<Schema>
}

/*
export type SchemaClassType<T extends Schema> = SchemaType<T> & {
	constructor: SchemaConstructor<T>
}
export type SchemaConstructor<T extends Schema> = {
	new (...args: any[]): SchemaClassType<T>
	__schema__: T
}

export function defineSchema<T extends SchemaObj>(name: string, schema: T): SchemaConstructor<T> {
	const constructor = class {
		static __schema__ = schema

		constructor() {
			constructDefaultObjOnto(this, constructor.__schema__)
		}
	}

	return constructor as SchemaConstructor<T>
}*/

///////////////////////////////////////Default Construction///////////////////////////////////////////////////////

async function constructDefaultObjOnto<T extends SchemaObj>(target: Record<string, any>, schema: T) {
	for (let prop in schema.properties) {
		if (canConstructDefault(schema.properties[prop])) {
			const newValue = await constructDefault(schema.properties[prop])
			if (newValue !== undefined) {
				target[prop] = newValue
			}
		}
	}
}

function canConstructDefault<T extends Schema>(schema: T) {
	return schema.type == Object || schema.required
}

/**
 * Constructs a default object of the schema supplied.
 * @param schema
 * @returns
 */
export async function constructDefault<T extends Schema>(schema: T): Promise<SchemaType<T>> {
	if (schema.type == Object) {
		const result: Record<string, any> = {}

		if ("properties" in schema) {
			await constructDefaultObjOnto(result, schema)
		}

		return result as SchemaType<T>
	} else if (schema.required) {
		if (schema.default) {
			if (isFunction(schema.default)) {
				return await schema.default()
			} else {
				return cloneDeep(schema.default)
			}
		} else {
			//Special cases for primitives
			if (schema.type == Array) return [] as SchemaType<T>
			if (schema.type == Number) return 0 as SchemaType<T>
			if (schema.type == String) return "" as SchemaType<T>
			if (schema.type == Boolean) return false as SchemaType<T>

			if ("factoryCreate" in schema.type) {
				return schema.type.factoryCreate() as SchemaType<T>
			}
			return new schema.type() as SchemaType<T>
		}
	}
	return undefined as SchemaType<T>
}

////////////////////////////////////Schema Squashes/////////////////////////////////////////////
// Squashing schemas combines two schemas into one type
type SquashedObjSchemas<A extends SchemaObj, B extends SchemaObj> = A & B
export type SquashedSchemas<A extends Schema, B extends Schema> = A & B

function squashObjSchemas<A extends SchemaObj, B extends SchemaObj>(a: A, b: B): SquashedObjSchemas<A, B> {
	const properties: Record<string, any> = {}
	const keys = Object.keys({ ...a.properties, ...b.properties })
	for (let key of keys) {
		properties[key] = squashSchemas(a.properties[key], b.properties[key])
	}

	return { ...a, ...b, properties } as unknown as SquashedObjSchemas<A, B>
}

type ExtractSchemaObj<T extends Schema> = T extends SchemaObj ? T : never

/**
 * Combines two schemas by overlaying B onto A
 * @param a
 * @param b
 */
export function squashSchemas<A extends Schema, B extends Schema>(a?: A, b?: B): SquashedSchemas<A, B> {
	if (a == null || b == null) {
		if (b != null) return b as SquashedSchemas<A, B>
		if (a != null) return a as SquashedSchemas<A, B>
		throw new Error("Can't merge nothing")
	}

	if (a.type == Object && "properties" in a && "properties" in b) {
		//Both are objects
		return squashObjSchemas<ExtractSchemaObj<A>, ExtractSchemaObj<B>>(
			a as ExtractSchemaObj<A>,
			b as ExtractSchemaObj<B>
		) as unknown as SquashedSchemas<A, B>
	} else if (a.type == Array && b.type == Array && "items" in a && "items" in b) {
		return { ...a, ...b, items: squashSchemas(a.items, b.items) }
	} else if (a.type == b.type) {
		return { ...a, ...b } as SquashedSchemas<A, B>
	}

	throw new Error("INCOMPATIBLE SCHEMAS")
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * Utility to create standalone schema values with the correct typing
 * @param schema
 * @returns
 */
export function declareSchema<T extends Schema>(schema: T): Readonly<T> {
	return schema
}

////////////////////////////////////Type Registry//////////////////////////////////////////

export type DataFactory<T = any> = { factoryCreate(...args: any[]): T }
type DataConstructor<T = any> = { new (...args: any): T }

export type DataConstructorOrFactory<T = any> = DataFactory<T> | DataConstructor<T>

export interface DataTypeMetaData<T extends DataConstructorOrFactory> {
	constructor: T
	canBeVariable?: boolean
	canBeCommandArg?: boolean
	expose?: (value: ResolvedTypeByConstructor<T>, schema: Schema) => ExposedTypeByConstructor<T>
	unexpose?: (value: ExposedTypeByConstructor<T>, schema: Schema) => ResolvedTypeByConstructor<T>
	/**
	 * Checks a value against it's schema, returns an error string if there's a problem
	 * @param value
	 * @param schema
	 * @returns string if there's a problem, undefined otherwise
	 */
	validate?: (value: TemplateTypeByConstructor<T> | undefined, schema: Schema) => string | undefined
	deserialize?: (value: any, schema: Schema) => Promise<TemplateTypeByConstructor<T>>
	serialize?: (value: TemplateTypeByConstructor<T>, schema: Schema) => any
	fromString?: (value: string) => Promise<ResolvedTypeByConstructor<T> | undefined>
	compare?: (lhs: ExposedTypeByConstructor<T>, rhs: any, operator: ValueCompareOperator) => boolean
	remoteTemplateResolve?: (
		remoteValue: RemoteTemplateTypeByConstructor<T>,
		schema: Schema
	) => ResolvedTypeByConstructor<T>
}

interface FullDataTypeMetaData<T extends DataConstructorOrFactory = any> extends DataTypeMetaData<T> {
	name: string
	canBeVariable: boolean
	canBeCommandArg: boolean
}

export function registerType<T extends DataConstructorOrFactory>(name: string, metaData: DataTypeMetaData<T>) {
	const fullMetaData = { canBeVariable: true, canBeCommandArg: false, ...metaData, name }
	dataNameLookup.set(name, fullMetaData)
	dataConstructorLookup.set(metaData.constructor, fullMetaData)
}

export function getAllTypes() {
	return [...dataNameLookup.values()]
}

export function getAllVariableTypes() {
	return [...dataNameLookup.values()].filter((d) => d.canBeVariable)
}

export function getAllCommandArgTypes() {
	return [...dataNameLookup.values()].filter((d) => d.canBeCommandArg)
}

export function getTypeByName(name: string) {
	return dataNameLookup.get(name)
}

export function getTypeByConstructor<T extends DataConstructorOrFactory>(constructor: T) {
	return dataConstructorLookup.get(constructor) as FullDataTypeMetaData<T> | undefined
}

///////////////////////////////////IPC Schemas/////////////////////////////////////////
//The IPC schema type set exists as a way to serialize schemas for transport on the IPC

export type IPCEnumable<T> = { enum?: Array<T> | { ipc: string } }
export type IPCDefaultable<T> = { default?: T | { ipc: string } }
export type IPCDynamicTypable = { dynamicType?: { ipc: string } }

type IPCHandleEnumable<T> = T extends Enumable<infer V> ? Modify<T, { enum?: { ipc: string } | Array<V> }> : T
type IPCHandleDefault<T> = T extends Defaultable<infer V> ? Modify<T, { default?: { ipc: string } | V }> : T
type IPCHandleDynamic<T> = T extends DynamicTypable ? Modify<T, { dynamicType?: { ipc: string } }> : T

export type IPCify<T extends Schema, Mods> = IPCHandleDynamic<IPCHandleDefault<IPCHandleEnumable<Modify<T, Mods>>>>

export type IPCSchemaTypes = IPCify<
	SchemaTypes,
	{
		type: string
	}
>

export type IPCSchemaObj = IPCify<
	SchemaObj,
	{
		type: "Object"
		properties: Record<string, IPCSchema>
	}
>

export type IPCSchemaArray = IPCify<
	SchemaArray,
	{
		type: "Array"
		items: IPCSchema
	}
>

export type IPCSchemaResource = IPCify<
	SchemaResource,
	{
		type: "Resource"
		resourceType: string
	}
>

export type IPCSchema = IPCSchemaTypes | IPCSchemaObj | IPCSchemaArray | IPCSchemaResource

///////////////////////////////////////Schema Paths///////////////////////////////////////////////

// Paths are strings referencing a member of a JS object. This utility provides proper typing for path strings

type DeepSchemaTypes = SchemaObj | SchemaArray

/**
 * Allows only valid path strings for the resulting schema type
 */
export type SchemaPaths<T extends Schema> = T extends SchemaObj
	? SchemaObjPaths<T>
	: T extends SchemaArray
	? SchemaArrayPaths<T>
	: ""

type SchemaObjPaths<T extends SchemaObj> = {
	[K in keyof T["properties"]]: T["properties"][K] extends DeepSchemaTypes
		? `${Exclude<K, symbol>}` | `${Exclude<K, symbol>}.${SchemaPaths<T["properties"][K]>}`
		: `${Exclude<K, symbol>}`
}[keyof T["properties"]]

type SchemaArrayPaths<T extends SchemaArray> = T["items"] extends DeepSchemaTypes
	? `${number}` | `${number}.${SchemaPaths<T["items"]>}`
	: `${number}`
