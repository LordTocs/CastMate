import { isObject } from "@vueuse/core"
import _cloneDeep from "lodash/cloneDeep"
import _isEqual from "lodash/isEqual"
import { DiffOpCode, iterDiff } from "./myers-diff"

export type DataDiff = GenericDiff<any> | ArrayDiff | ObjectDiff

export function computeDataDiff(a: any, b: any): DataDiff | undefined {
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

function applyDataDiffArray(arr: any, diff: ArrayDiff) {
	if (!Array.isArray(arr)) throw new Error("Diff Type Mismatch")
	for (const op of diff.ops) {
		if (op.type == "delete") {
			arr.splice(op.index, 1)
		} else if (op.type == "insert") {
			arr.splice(op.index, 0, op.value)
		} else if (op.type == "diff") {
			applyDataDiff(arr, op.index, op.diff)
		}
	}
}

function applyDataDiffObject(obj: any, diff: ObjectDiff) {
	if (typeof obj != "object") throw new Error("Diff Type Mismatch")
	for (const prop in diff.properties) {
		const op = diff.properties[prop]
		if (op.op == "added") {
			obj[prop] = op.value
		} else if (op.op == "removed") {
			delete obj[prop]
		} else if (op.op == "diff") {
			applyDataDiff(obj, prop, op.diff)
		}
	}
}

export function applyDataDiff<T>(parent: T, key: keyof T, diff: DataDiff) {
	if (diff.type == "array") {
		applyDataDiffArray(parent[key], diff)
	} else if (diff.type == "object") {
		applyDataDiffObject(parent[key], diff)
	} else if (diff.type == "generic") {
		parent[key] = diff.newValue
	}
}

function applyInvDataDiffArray(arr: any, diff: ArrayDiff) {
	if (!Array.isArray(arr)) throw new Error("Diff Type Mismatch")
	for (const op of diff.ops) {
		if (op.type == "delete") {
			arr.splice(op.index, 0, op.oldValue)
		} else if (op.type == "insert") {
			arr.splice(op.index, 1)
		} else if (op.type == "diff") {
			applyInvDataDiff(arr, op.index, op.diff)
		}
	}
}

function applyInvDataDiffObject(obj: any, diff: ObjectDiff) {
	if (typeof obj != "object") throw new Error("Diff Type Mismatch")
	for (const prop in diff.properties) {
		const op = diff.properties[prop]
		if (op.op == "added") {
			delete obj[prop]
		} else if (op.op == "removed") {
			obj[prop] = op.oldValue
		} else if (op.op == "diff") {
			applyInvDataDiff(obj, prop, op.diff)
		}
	}
}

export function applyInvDataDiff<T>(parent: T, key: keyof T, diff: DataDiff) {
	if (diff.type == "array") {
		applyInvDataDiffArray(parent[key], diff)
	} else if (diff.type == "object") {
		applyInvDataDiffObject(parent[key], diff)
	} else if (diff.type == "generic") {
		parent[key] = diff.oldValue
	}
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

function dataCompare(a: any, b: any) {
	if (isObject(a) && isObject(b)) {
		if ("id" in a && "id" in b) {
			return a.id == b.id
		}
	}
	return _isEqual(a, b)
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
	ops: ArrayDiffOp[]
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

function computeArrayDiff(a: any[], b: any[]): ArrayDiff | undefined {
	const result: ArrayDiffOp[] = []

	let index = 0
	for (let diffOp of iterDiff(a, b, dataCompare)) {
		//console.log("ArrDiff", diffOp)
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

	return result.length > 0 ? { type: "array", ops: result } : undefined
}
