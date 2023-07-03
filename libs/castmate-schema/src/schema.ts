import { cloneDeep } from "lodash"
//TODO: How to type default
//TODO: How to enforce default's existance when required: true

export type MapToUnion<T> = T[keyof T]

type EnumItem<T> = T | EnumPair<T>

//TODO: Can we type context?
export interface Enumable<T> {
	enum?: Array<EnumItem<T>> | (() => Promise<Array<EnumItem<T>>>) | ((context: any) => Promise<Array<EnumItem<T>>>)
}

export type SchemaBase = {
	name?: string
	required?: boolean
	default?: any
}

export interface SchemaNumber extends Enumable<number> {
	type: NumberConstructor
	min?: number
	max?: number
	step?: number
	slider?: boolean
	unit?: string
	template?: boolean
}

export interface SchemaString extends Enumable<string> {
	type: StringConstructor
	template?: boolean
}

export interface SchemaBoolean {
	type: BooleanConstructor
	trueIcon?: string
	falseIcon?: string
}

interface EnumPair<T> {
	value: T
	name: string
}

export type SchemaObj = {
	type: ObjectConstructor
	properties: Record<string, Schema>
} & SchemaBase

export type SchemaArray = {
	type: ArrayConstructor
	items: Schema
} & SchemaBase

interface SchemaTypeMap {
	string: [SchemaString, string]
	number: [SchemaNumber, number]
	boolean: [SchemaBoolean, boolean]
}

type SchemaTypeUnion = MapToUnion<SchemaTypeMap>
export type SchemaTypes = SchemaTypeUnion[0] & SchemaBase

type SchemaPropTypeInner<T extends Schema> = Extract<
	SchemaTypeUnion,
	T extends { type: infer Constructor } ? [{ type: Constructor }, any] : [never, any]
>[1]

type SchemaApplyRequired<SchemaT extends Schema, T> = SchemaT["required"] extends true ? T : T | undefined

type SchemaPropType<T extends Schema> = SchemaPropTypeInner<T>

type SchemaObjType<T extends SchemaObj> = {
	[Property in keyof T["properties"]]: SchemaType<T["properties"][Property]>
}

type SchemaArrayType<T extends SchemaArray> = Array<SchemaType<T["items"]>>

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
				: SchemaPropType<T>
	  >

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
}

function constructDefaultObjOnto<T extends SchemaObj>(target: Record<string, any>, schema: T) {
	for (let prop in schema.properties) {
		if (canConstructDefault(schema.properties[prop])) {
			const newValue = constructDefault(schema.properties[prop])
			if (newValue != undefined) {
				target[prop] = newValue
			}
		}
	}
}

function canConstructDefault<T extends Schema>(schema: T) {
	return schema.type == Object || schema.required
}

export function constructDefault<T extends Schema>(schema: T): SchemaType<T> {
	if (schema.type == Object) {
		const result: Record<string, any> = {}

		if ("properties" in schema) {
			constructDefaultObjOnto(result, schema)
		}

		return result as SchemaType<T>
	} else if (schema.required) {
		if (schema.default) {
			return cloneDeep(schema.default)
		} else {
			if (schema.type == Array) {
				return [] as SchemaType<T>
			}
			return new schema.type() as SchemaType<T>
		}
	}
	//Type system too stupid to realize !schema.required allows undefined.
	//@ts-ignore
	return undefined
}
/*
type SquashedObjSchemas<A extends SchemaObj, B extends SchemaObj> = Omit<A, "properties"> &
	Omit<B, "properties"> & {
		type: ObjectConstructor
		properties: {
			[Property in keyof (A["properties"] & B["properties"])]: A["properties"] extends {
				[P in Property]: any
			}
				? B["properties"] extends { [P in Property]: any }
					? SquashedSchemas<A["properties"][Property], B["properties"][Property]>
					: A["properties"][Property]
				: B["properties"][Property]
		}
	}
*/
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

///

type DataConstructor = { new (...args: any): any }
export interface DataTypeMetaData<T = any> {
	constructor: new (...args: any) => T
	template?: (value: T, context: any, schema: any) => T
}

interface FullDataTypeMetaData<T = any> extends DataTypeMetaData<T> {
	name: string
}

const dataNameLookup: Map<string, FullDataTypeMetaData> = new Map()
const dataConstructorLookup: Map<DataConstructor, FullDataTypeMetaData> = new Map()

export function registerType<T>(name: string, metaData: DataTypeMetaData<T>) {
	const fullMetaData = { ...metaData, name }
	dataNameLookup.set(name, fullMetaData)
	dataConstructorLookup.set(metaData.constructor, fullMetaData)
}

export function getTypeByName<T = any>(name: string) {
	return dataNameLookup.get(name) as FullDataTypeMetaData<T> | undefined
}

export function getTypeByConstructor<T = any>(constructor: new (...args: any) => T) {
	return dataConstructorLookup.get(constructor) as FullDataTypeMetaData<T> | undefined
}

type Modify<T, R> = Omit<T, keyof R> & R

type IPCHandleEnumable<T> = T extends Enumable<infer V> ? Modify<T, { enum?: string | Array<V> }> : T

export type IPCify<T extends Schema, Mods> = IPCHandleEnumable<Modify<T, Mods>>

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
		resourceId: string
	}
>

export type IPCSchema = IPCSchemaTypes | IPCSchemaObj | IPCSchemaArray | IPCSchemaResource

/////////////////////////////////

function testSchema<T extends Schema>(spec: { config: T; handle: (config: SchemaType<T>) => any }) {}

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

const TestType = defineSchema("TestType", {
	type: Object,
	properties: {
		num: { type: Number, template: true, required: true, default: 10 },
		str: { type: String },
		arr: { type: Array, items: { type: String, required: true }, required: true },
	},
})
type TestType = InstanceType<typeof TestType>

function f2<A extends SchemaObj, B extends SchemaObj>(a: A, b: B): A {
	const combined = squashObjSchemas(a, b)

	return combined
}
