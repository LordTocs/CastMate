import { isObject } from "@vueuse/core"
import _cloneDeep from "lodash/cloneDeep"
import { DiffOpCode, iterDiff } from "./myers-diff"

export function computeDataDiff(a: any, b: any) {
	if (Array.isArray(a)) {
		if (!Array.isArray(b)) {
			// Replace
			const diff: GenericDiff = {
				type: "generic",
				oldValue: _cloneDeep(a),
				newValue: _cloneDeep(b),
			}
			return diff
		}

		return computeArrayDiff(a, b)
	} else if (isObject(a)) {
		if (!isObject(b)) {
			// Replace
			const diff: GenericDiff = {
				type: "generic",
				oldValue: _cloneDeep(a),
				newValue: _cloneDeep(b),
			}
			return diff
		}
		return computeObjectDiff(a, b)
	} else {
		if (b != a) {
			const diff: GenericDiff = {
				type: "generic",
				oldValue: _cloneDeep(a),
				newValue: _cloneDeep(b),
			}
			return diff
		}
	}
	return undefined
}

interface GenericDiff<T = any> {
	type: "generic"
	oldValue: T
	newValue: T
}

interface Obj {
	[key: PropertyKey]: any
}

interface RemovedProp {
	op: "removed"
	oldValue: any
}

interface AddedProp {
	op: "added"
	value: any
}

interface DiffProp {
	op: "diff"
	diff: any
}

type PropChange = RemovedProp | AddedProp | DiffProp

interface ObjectDiff {
	type: "object"
	properties: {
		[key: PropertyKey]: PropChange
	}
}

function computeObjectDiff(a: Obj, b: Obj) {
	const aKeys = Object.keys(a)
	const bKeys = Object.keys(b)

	const aKeySet = new Set(Object.keys(a))
	const bKeySet = new Set(Object.keys(b))

	const deletedKeys = aKeys.filter((k) => !bKeySet.has(k))
	const addedKeys = bKeys.filter((k) => !aKeySet.has(k))
	const sameKeys = aKeys.filter((k) => bKeySet.has(k))

	const diff: ObjectDiff = {
		type: "object",
		properties: {},
	}

	let hasDiff = false

	for (let key of deletedKeys) {
		diff.properties[key] = {
			op: "removed",
			oldValue: a[key],
		}
		hasDiff = true
	}

	for (let key of addedKeys) {
		diff.properties[key] = {
			op: "added",
			value: b[key],
		}
		hasDiff = true
	}

	for (let key of sameKeys) {
		const keyDiff = computeDataDiff(a[key], b[key])
		if (keyDiff) {
			diff.properties[key] = {
				op: "diff",
				diff: keyDiff,
			}
			hasDiff = true
		}
	}

	return hasDiff ? diff : undefined
}

interface ArrayDiff {
	type: "array"
}

interface ArrayDiffOpInsert {
	type: "insert"
	index: number
	value: any
}

interface ArrayDiffOpDelete {
	type: "delete"
	index: number
	oldValue: any
}

interface ArrayDiffOpDiff {
	type: "diff"
	index: number
	diff: any
}

type ArrayDiffOp = ArrayDiffOpDiff | ArrayDiffOpDelete | ArrayDiffOpInsert

function computeArrayDiff(a: any[], b: any[]) {
	const result: ArrayDiffOp[] = []

	let index = 0
	for (let diffOp of iterDiff(a, b)) {
		console.log("ArrDiff", diffOp)
		if (diffOp.type == DiffOpCode.Equal) {
			const subdiff = computeDataDiff(diffOp.oldValue, diffOp.newValue)
			if (subdiff) {
				result.push({
					type: "diff",
					index,
					diff: subdiff,
				})
			}
		} else if (diffOp.type == DiffOpCode.Delete) {
			result.push({
				type: "delete",
				index,
				oldValue: diffOp.oldValue,
			})
			index--
		} else if (diffOp.type == DiffOpCode.Insert) {
			result.push({
				type: "insert",
				index,
				value: diffOp.value,
			})
		}

		index++
	}

	return result.length > 0 ? result : undefined
}
