export function mapMap<K, V, T>(map: Map<K, V>, mapFunc: (key: K, value: V) => T): Map<K, T> {
	const result: Map<K, T> = new Map()
	for (let key of map.keys()) {
		//@ts-ignore type system too stupid to realize we have the key
		result.set(key, mapFunc(key, map.get(key)))
	}
	return result
}

export function mapRecord<V, T>(map: Map<string, V>, mapFunc: (key: string, value: V) => T): Record<string, T> {
	const result: Record<string, T> = {}

	for (let key of map.keys()) {
		//@ts-ignore type system too stupid to realize we have the key
		result[key] = mapFunc(key, map.get(key))
	}

	return result
}

export function mapKeys<V, T>(
	map: Record<string | symbol | number, V>,
	mapFunc: (key: string | symbol | number, value: V) => T
): Record<string | number | symbol, T> {
	const result: Record<string | symbol | number, T> = {}

	for (let key in map) {
		result[key] = mapFunc(key, map[key])
	}

	return result
}

export function isKey(k: any): k is string | symbol | number {
	return typeof k === "string" || typeof k === "number" || typeof k === "symbol"
}

export type NestedKeyOf<T, K = keyof T> = K extends keyof T & (string | number)
	? `${K}` | (T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : never)
	: never

export function getByPath<ObjectType extends object>(object: ObjectType, path: string) {
	const keys = path.split(".")
	let result = object
	for (const key of keys) {
		result = (result as Record<string, any>)[key]
	}
	return result
}
