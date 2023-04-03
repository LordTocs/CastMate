export function isSymbol(value: unknown): value is symbol {
	return typeof value === "symbol"
}

export const isArray = Array.isArray

export function isObject(value: unknown): value is object {
	return typeof value === "object"
}
