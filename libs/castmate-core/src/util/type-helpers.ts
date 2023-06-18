export function isSymbol(value: unknown): value is symbol {
	return typeof value === "symbol"
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

export function mapMap<K, V, T>(map: Map<K, V>, mapFunc: (key: K, value: V) => T): Map<K, T> {
	const result: Map<K, T> = new Map()

	for (let key of map.keys()) {
		const v = map.get(key)
		if (v != undefined) {
			result.set(key, mapFunc(key, v))
		}
	}

	return result
}
