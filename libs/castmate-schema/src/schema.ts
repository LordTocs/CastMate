import { cloneDeep, isFunction } from "lodash"
import { MaybePromise } from "./util/type-helpers"
//TODO: How to type default
//TODO: How to enforce default's existance when required: true

export type MapToUnion<T> = T[keyof T]

export interface EnumPair<T> {
	value: T
	name: string
}

export type EnumItem<T> = T | EnumPair<T>

//TODO: Can we type context?
export interface Enumable<T> {
	enum?: Array<EnumItem<T>> | (() => Promise<Array<EnumItem<T>>>) | ((context: any) => Promise<Array<EnumItem<T>>>)
}

export interface Defaultable<T> {
	default?: T | (() => MaybePromise<T>)
}

export interface DynamicTypable {
	dynamicType(context: any): Promise<Schema>
}

export interface SchemaBase<T = any> extends Defaultable<T> {
	name?: string
	required?: boolean
}

interface MaybeTemplated {
	template?: boolean
}

export interface SchemaNumber extends Enumable<number>, SchemaBase<number> {
	type: NumberConstructor
	min?: number
	max?: number
	step?: number
	slider?: boolean
	unit?: string
	template?: boolean
}

export interface SchemaString extends Enumable<string>, SchemaBase<string> {
	type: StringConstructor
	template?: boolean
	maxLength?: number
}

export interface SchemaBoolean extends SchemaBase<boolean> {
	type: BooleanConstructor
	trueIcon?: string
	falseIcon?: string
}

export interface SchemaObj extends SchemaBase<object> {
	type: ObjectConstructor
	properties: Record<string, Schema>
}

export interface SchemaArray extends SchemaBase<Array<any>> {
	type: ArrayConstructor
	items: Schema
}

//Must be exported for interface merging to work
export interface SchemaTypeMap {
	string: [SchemaString, string]
	number: [SchemaNumber, number]
	boolean: [SchemaBoolean, boolean]
}

type SchemaTypeUnion = MapToUnion<SchemaTypeMap>
type SchemaTypes = SchemaTypeUnion[0]

type SchemaApplyRequired<SchemaT extends Schema, T> = SchemaT["required"] extends true ? T : T | undefined
type SchemaApplyTemplate<SchemaT extends Schema, T> = SchemaT extends MaybeTemplated
	? SchemaT["template"] extends true
		? T | string
		: T
	: T

type SchemaPropType<T extends Schema> = Extract<
	SchemaTypeUnion,
	T extends { type: infer ConstructorOrFactory } ? [{ type: ConstructorOrFactory }, any] : [never, any]
>[1]

type SchemaObjType<T extends SchemaObj> = {
	[Property in keyof T["properties"]]: SchemaType<T["properties"][Property]>
}

type ResolvedSchemaObjType<T extends SchemaObj> = {
	[Property in keyof T["properties"]]: ResolvedSchemaType<T["properties"][Property]>
}

type SchemaArrayType<T extends SchemaArray> = Array<SchemaType<T["items"]>>

type ResolvedSchemaArrayType<T extends SchemaArray> = Array<ResolvedSchemaType<T["items"]>>

interface ResourceType {
	id: string
}
type ResourceTypeConstructor = { new (...args: any[]): ResourceType }

export interface SchemaResource extends SchemaBase {
	type: ResourceTypeConstructor
}

type SchemaResourceType<T extends SchemaResource> = InstanceType<T["type"]>

export type Schema = SchemaTypes | SchemaObj | SchemaArray | SchemaResource

export type SchemaType<T extends Schema> = T extends SchemaObj
	? SchemaObjType<T>
	: SchemaApplyRequired<
			T,
			T extends SchemaArray
				? SchemaArrayType<T>
				: T extends SchemaResource
				? SchemaResourceType<T>
				: SchemaApplyTemplate<T, SchemaPropType<T>>
	  >

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

export type SchemaClassType<T extends Schema> = SchemaType<T> & {
	constructor: SchemaConstructor<T>
}
export type SchemaConstructor<T extends Schema> = {
	new (...args: any[]): SchemaClassType<T>
	__schema__: T
}
/*
export function defineSchema<T extends SchemaObj>(name: string, schema: T): SchemaConstructor<T> {
	const constructor = class {
		static __schema__ = schema

		constructor() {
			constructDefaultObjOnto(this, constructor.__schema__)
		}
	}

	return constructor as SchemaConstructor<T>
}*/

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
	//Type system too stupid to realize !schema.required allows undefined.
	//@ts-ignore
	return undefined
}

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
 * Squash A onto B
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

export function declareSchema<T extends Schema>(schema: T): Readonly<T> {
	return schema
}
///

export type DataFactory<T = any> = { factoryCreate(...args: any[]): T }
type DataConstructor<T = any> = { new (...args: any): T }

export type DataConstructorOrFactory<T = any> = DataFactory<T> | DataConstructor<T>
export interface DataTypeMetaData<T = any> {
	constructor: DataConstructorOrFactory<T>
	canBeVariable?: boolean
	validate?: (value: any, schema: Schema) => string | undefined
	deserialize?: (value: any, schema: Schema) => Promise<T>
	serialize?: (value: T, schema: Schema) => any
}

interface FullDataTypeMetaData<T = any> extends DataTypeMetaData<T> {
	name: string
	canBeVariable: boolean
}

const dataNameLookup: Map<string, FullDataTypeMetaData> = new Map()
const dataConstructorLookup: Map<DataConstructorOrFactory, FullDataTypeMetaData> = new Map()

export function registerType<T>(name: string, metaData: DataTypeMetaData<T>) {
	console.log("Registering Type", name)
	const fullMetaData = { canBeVariable: true, ...metaData, name }
	dataNameLookup.set(name, fullMetaData)
	dataConstructorLookup.set(metaData.constructor, fullMetaData)
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
})
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
			return `${schema.name} must be less than ${schema.min}`
		}

		return undefined
	},
})
registerType("Boolean", {
	constructor: Boolean,
})

export function getAllTypes() {
	return [...dataNameLookup.values()]
}

export function getTypeByName<T = any>(name: string) {
	return dataNameLookup.get(name) as FullDataTypeMetaData<T> | undefined
}

export function getTypeByConstructor<T = any>(constructor: DataConstructorOrFactory<T>) {
	return dataConstructorLookup.get(constructor) as FullDataTypeMetaData<T> | undefined
}

type Modify<T, R> = Omit<T, keyof R> & R

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

/////////////////////////////////

function testSchema<T extends Schema>(spec: { config: T; handle: (config: ResolvedSchemaType<T>) => any }) {}

testSchema({
	config: {
		type: Object,
		properties: {
			num: { type: Number, template: true, required: true, default: 10 },
			str: { type: String },
		},
	},
	handle(config) {
		config.num = 10
		config.str = "yo"
	},
})

testSchema({
	config: squashObjSchemas(
		{
			type: Object,
			properties: {
				hello: { type: String, required: true, default: "hello" },
				blah: { type: Number, required: true, default: 10 },
			},
		},
		{
			type: Object,
			properties: { goodbye: { type: String }, blah: { type: Number } },
		}
	),
	handle(config) {},
})

const squish = squashSchemas(
	{ type: Object, properties: { hello: { type: String } } },
	{ type: Object, properties: { goodbye: { type: String } } }
)
/*
const TestType = defineSchema("TestType", {
	type: Object,
	properties: {
		num: { type: Number, template: true, required: true, default: 10 },
		str: { type: String },
		arr: { type: Array, items: { type: String, required: true }, required: true },
	},
})
type TestType = InstanceType<typeof TestType>
*/
type DeepSchemaTypes = SchemaObj | SchemaArray

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

const test = declareSchema({
	type: Object,
	properties: {
		hello: { type: String },
		test: {
			type: Object,
			properties: {
				a: { type: Number, required: true },
				b: {
					type: Array,
					items: {
						type: Object,
						properties: {
							c: { type: String },
						},
						required: true,
					},
					required: true,
				},
			},
		},
	},
})

function tp(p: SchemaPaths<typeof test>) {}

tp("test.a")
