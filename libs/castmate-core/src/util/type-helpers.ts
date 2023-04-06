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
