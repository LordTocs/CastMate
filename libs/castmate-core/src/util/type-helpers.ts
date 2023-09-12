export function isSymbol(value: unknown): value is symbol {
	return typeof value === "symbol"
}

export function isString(value: unknown): value is string {
	return typeof value === "string"
}

export const isArray = Array.isArray

export function isObject(value: unknown): value is object {
	return typeof value === "object"
}

type SV3 = `${number}.${number}.${number}`
type SV3Label = `${number}.${number}.${number}${string}`

export type SemanticVersion = SV3 | SV3Label

export type Immutable<T> = T extends Function | boolean | number | string | null | undefined
	? T
	: T extends Array<infer U>
	? ReadonlyArray<Immutable<U>>
	: T extends Map<infer K, infer V>
	? ReadonlyMap<Immutable<K>, Immutable<V>>
	: T extends Set<infer S>
	? ReadonlySet<Immutable<S>>
	: { readonly [P in keyof T]: Immutable<T[P]> }

export type MapToUnion<T> = T[keyof T]

export type ConstructedType<T extends new (...args: any[]) => any> = T extends new (...args: any[]) => infer R
	? R
	: never
