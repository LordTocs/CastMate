import _ from "lodash"
import util from "util"

//https://blog.jcoglan.com/2017/04/25/myers-diff-in-linear-space-implementation/

class Box {
	left: number
	right: number
	bottom: number
	top: number

	constructor(left: number, top: number, right: number, bottom: number) {
		this.left = left
		this.top = top
		this.right = right
		this.bottom = bottom
	}

	get width() {
		return this.right - this.left
	}

	get height() {
		return this.bottom - this.top
	}

	get size() {
		return this.width + this.height
	}

	get delta() {
		return this.width - this.height
	}
}

function spaceship(val1: any, val2: any) {
	if (val1 === null || val2 === null || typeof val1 != typeof val2) {
		return null
	}
	if (typeof val1 === "string") {
		return val1.localeCompare(val2)
	} else {
		if (val1 > val2) {
			return 1
		} else if (val1 < val2) {
			return -1
		}
		return 0
	}
}

type PathResult = number[][]

function diff<E>(a: ArrayLike<E>, b: ArrayLike<E>) {
	for (const [x1, y1, x2, y2] of walkSnakes(a, b, (a, b) => a == b)) {
		if (x1 == x2) {
			//Insert
		} else if (y1 == y2) {
			//Delete
		} else {
			//Eq
		}
	}
}

export enum DiffOpCode {
	Insert,
	Delete,
	Equal,
}

interface DiffOpDelete<E> {
	type: DiffOpCode.Delete
	oldValue: E
}

interface DiffOpInsert<E> {
	type: DiffOpCode.Insert
	value: E
}

interface DiffOpEqual<E> {
	type: DiffOpCode.Equal
	oldValue: E
	newValue: E
}

type DiffOp<E> = DiffOpDelete<E> | DiffOpInsert<E> | DiffOpEqual<E>

export function* iterDiff<E>(a: ArrayLike<E>, b: ArrayLike<E>): IterableIterator<DiffOp<E>> {
	for (const [x1, y1, x2, y2] of walkSnakes(a, b, (a, b) => a == b)) {
		if (x1 == x2) {
			//Insert
			yield { type: DiffOpCode.Insert, value: b[y1] }
		} else if (y1 == y2) {
			//Delete
			yield { type: DiffOpCode.Delete, oldValue: a[x1] }
		} else {
			//Eq
			yield { type: DiffOpCode.Equal, oldValue: a[x1], newValue: b[y1] }
		}
	}
}

let indent = ""
function* walkSnakes<E>(a: ArrayLike<E>, b: ArrayLike<E>, compare: (a: E, b: E) => boolean) {
	console.log("Walk Snakes", a, b)

	indent = ""
	const path = findPath(0, 0, a.length, b.length, a, b, compare)

	if (!path) {
		return
	}

	//Iterate Pairs
	for (let i = 0; i < path.length - 1; ++i) {
		let [x1, y1] = path[i]
		let [x2, y2] = path[i + 1]

		console.log(`Pair ${x1}, ${y1} -> ${x2}, ${y2}`)

		while (x1 < x2 && y1 < y2 && compare(a[x1], b[y1])) {
			//The same
			yield [x1, y1, x1 + 1, y1 + 1]
			x1++
			y1++
		}

		const horizontal = spaceship(x2 - x1, y2 - y1)

		if (horizontal == -1) {
			//Insert
			yield [x1, y1, x1, y1 + 1]
			y1 += 1
		} else if (horizontal == 1) {
			//Delete
			yield [x1, y1, x1 + 1, y1]
			x1 += 1
		}

		while (x1 < x2 && y1 < y2 && compare(a[x1], b[y1])) {
			//The same
			yield [x1, y1, x1 + 1, y1 + 1]
			x1++
			y1++
		}
	}
}

function findPath<E>(
	left: number,
	top: number,
	right: number,
	bottom: number,
	a: ArrayLike<E>,
	b: ArrayLike<E>,
	compare: (a: E, b: E) => boolean
): PathResult | undefined {
	const box = new Box(left, top, right, bottom)
	console.log(indent, "FindPath", box, left, top, right, bottom)
	indent = indent + "  "

	const snake = midpoint(box, a, b, compare)
	console.log(`${indent}Snake ${util.inspect(snake)}`)

	if (!snake) {
		indent = indent.substring(0, indent.length - 2)
		console.log(indent, "P: ", undefined)
		return undefined
	}

	const [start, finish] = snake

	console.log(indent, "head")
	const head = findPath(box.left, box.top, start[0], start[1], a, b, compare)
	console.log(indent, "tail")
	const tail = findPath(finish[0], finish[1], box.right, box.bottom, a, b, compare)

	const result = [...(head ? head : [start]), ...(tail ? tail : [finish])]

	indent = indent.substring(0, indent.length - 2)
	console.log(indent, "P: ", result)

	return result
}

function midpoint<E>(box: Box, a: ArrayLike<E>, b: ArrayLike<E>, compare: (a: E, b: E) => boolean) {
	if (box.size == 0) {
		return undefined
	}

	console.log(indent, "Midpoint", box)

	const max = Math.ceil(box.size / 2)

	const vf = new Array(2 * max + 1)
	const vb = new Array(2 * max + 1)
	vf[1] = box.left
	vb[1] = box.bottom

	for (let d = 0; d <= max; ++d) {
		const fi = forwards(box, vf, vb, d, a, b, compare)
		const fr = fi.next().value
		if (fr) {
			console.log(indent, "  Picked Front")
			return fr
		}

		const bi = backwards(box, vf, vb, d, a, b, compare)
		const br = bi.next().value
		if (br) {
			console.log(indent, "  Picked Back")
			return br
		}
	}
}

function rubyArrayGet<E>(arr: E[], index: number) {
	const i = ((index % arr.length) + arr.length) % arr.length
	return arr[i]
}

function rubyArraySet<E>(arr: E[], index: number, value: E) {
	const i = ((index % arr.length) + arr.length) % arr.length
	arr[i] = value
}

//Scan forwards minimizing deletions
function* forwards<E>(
	box: Box,
	vf: number[],
	vb: number[],
	d: number,
	a: ArrayLike<E>,
	b: ArrayLike<E>,
	compare: (a: E, b: E) => boolean
) {
	console.log(indent, "  Forwards", box, vf, vb, d)
	for (let k = d; k >= -d; k -= 2) {
		const c = k - box.delta

		let px: number
		let x: number
		if (k == -d || (k != d && rubyArrayGet(vf, k - 1) < rubyArrayGet(vf, k + 1))) {
			px = rubyArrayGet(vf, k + 1)
			x = px
		} else {
			px = rubyArrayGet(vf, k - 1)
			x = px + 1
		}

		let y = box.top + (x - box.left) - k
		let py = d == 0 || x != px ? y : y - 1

		//Move diagonally?
		while (x < box.right && y < box.bottom && compare(a[x], b[y])) {
			x = x + 1
			y = y + 1
		}

		//console.log("    ", k, c, x, y, px, py)

		rubyArraySet(vf, k, x)

		console.log(indent, "    f", k, x)

		if (box.delta % 2 != 0 && between(c, -(d - 1), d - 1) && y >= rubyArrayGet(vb, c)) {
			yield [
				[px, py],
				[x, y],
			]
		}
	}
}

function between(n: number, min: number, max: number) {
	return n >= min && n <= max
}

//Scan backwards maximizing insertions
function* backwards<E>(
	box: Box,
	vf: number[],
	vb: number[],
	d: number,
	a: ArrayLike<E>,
	b: ArrayLike<E>,
	compare: (a: E, b: E) => boolean
) {
	console.log(indent, "  Backwards", box, vf, vb, d)
	for (let c = d; c >= -d; c -= 2) {
		const k = c + box.delta

		let py: number
		let y: number
		if (c == -d || (c != d && rubyArrayGet(vb, c - 1) < rubyArrayGet(vb, c + 1))) {
			py = rubyArrayGet(vb, c + 1)
			y = py
		} else {
			py = rubyArrayGet(vb, c - 1)
			y = py - 1
		}

		let x = box.left + (y - box.top) + k
		let px = d == 0 || y != py ? x : x + 1

		//Move diagonally?
		while (x > box.left && y > box.top && compare(a[x - 1], b[y - 1])) {
			x = x - 1
			y = y - 1
		}

		rubyArraySet(vb, c, y)

		console.log(indent, "    b", c, y)

		if (box.delta % 2 == 0 && between(k, -d, d) && x <= rubyArrayGet(vf, k)) {
			yield [
				[x, y],
				[px, py],
			]
		}
	}
}
