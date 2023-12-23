//Faster dictionary matching? Hopefully good for emote detection!

//See:

// Fast Algorithms for Two Dimensional and Multiple Pattern Matching (Baeza-Yates / Régnier)
// https://www.docdroid.net/dz9r/byr90-pdf#page=7

// Other Refs:
// https://cs.stackexchange.com/questions/28196/understanding-the-baeza-yates-r%C3%A9gnier-algorithm-multiple-string-matching-exten
// https://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_algorithm
// https://en.wikipedia.org/wiki/Commentz-Walter_algorithm
// https://en.wikipedia.org/wiki/Boyer%E2%80%93Moore%E2%80%93Horspool_algorithm

interface MatchingTrieNode {
	shift: number
	matchValue?: string
	children: Record<string, MatchingTrieNode>
}

type DTable = Record<string, number>

function buildDTable(substrings: string[]) {
	const dTable: DTable = {}
	const charSet = new Set<string>()

	for (const substr of substrings) {
		for (const c of substr) {
			charSet.add(c)
		}
	}

	for (const c of charSet) {
		let d = substrings[0].length //TODO BIG NUMBER

		for (const substring of substrings) {
			let localD = substring.length

			for (let s = 1; s < substring.length - 1 && s < d; ++s) {
				const char = substring[substring.length - s - 1]
				if (char == c) {
					localD = s
				}
			}

			d = Math.min(d, localD)
		}

		dTable[c] = d
	}

	return dTable
}

//See section 4 (The New Multi-string Searching Algorithm)
// https://www.docdroid.net/dz9r/byr90-pdf#page=7
function computeDD(substrings: string[], i: number, j: number) {
	//i and j are 1 indexed because white papers are dumb
	let dd = 100000

	const pi = substrings[i - 1]
	const mi = pi.length

	for (const pk of substrings) {
		const mk = pk.length
		const mm = Math.max(mi, mk)

		let s = Math.max(j + mk - mi, 1)

		for (; s < mm; s++) {
			if (s >= j + mk - mi || pk[j - s + mk - mi - 1] != pi[j - 1]) {
				let failed = false
				for (let l = j + 1; l <= mi; ++l) {
					if (!(s >= l + mk - mi || pk[l - s + mk - mi - 1] == pi[l - 1])) {
						failed = true
						break
					}
				}

				if (!failed) {
					dd = Math.min(dd, s)
					break
				}
			}
		}
	}

	return dd
}

export interface MatchingTrie {
	root: MatchingTrieNode
	dElse: number
	dTable: DTable
}

export function buildMatchingTrie(substrings: string[]): MatchingTrie {
	const root: MatchingTrieNode = {
		shift: 1,
		children: {},
	}

	//Length of the shortest substring to search for
	const minLength = Math.min(...substrings.map((s) => s.length))

	let si = 1
	for (const substring of substrings) {
		//Our match trie is backwards like boyer moore
		let buildNode = root
		for (let i = substring.length - 1; i >= 0; --i) {
			const c = substring[i]

			if (buildNode.children[c]) {
				buildNode = buildNode.children[c]
			} else {
				const newNode: MatchingTrieNode = {
					shift: computeDD(substrings, si, i), //Why not i + 1??
					children: {},
				}

				if (i == 0) {
					newNode.matchValue = substring
				}

				buildNode.children[c] = newNode
				buildNode = newNode
			}
		}

		si++
	}

	return {
		root,
		dElse: minLength,
		dTable: buildDTable(substrings),
	}
}

export interface TrieFind {
	index: number
	match: string
}
export function findNextTrieMatch(str: string, trie: MatchingTrie, startIndex = 0): TrieFind | undefined {
	let i = startIndex + trie.dElse - 1
	let node = trie.root

	while (i < str.length) {
		const c = str[i]

		const nextNode = node.children[c]

		if (!nextNode) {
			//We missed!
			const d = trie.dTable[c] ?? trie.dElse
			const dd = node.shift

			//console.log("Missed", c, d, dd)

			node = trie.root
			i += Math.max(d, dd)
		} else {
			if (nextNode.matchValue) {
				return { index: i, match: nextNode.matchValue }
			}
			//console.log("Hit", c)
			node = nextNode
			--i
		}
	}

	return undefined
}

//https://stackoverflow.com/questions/42742810/speed-up-millions-of-regex-replacements-in-python-3/42789508#42789508

export function escapeRegExp(str: string) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
}

interface RegexTrieNode {
	children: Record<string, RegexTrieNode>
	leaf?: boolean
}

function convertToPattern(node: RegexTrieNode) {
	const childrenKeys = Object.keys(node.children)
	if (childrenKeys.length == 0 && node.leaf) {
		return undefined
	}

	childrenKeys.sort()

	const alt: string[] = []
	const cc: string[] = []
	let q = 0 //??????? this is node.leaf == true

	for (const c of childrenKeys) {
		const childNode = node.children[c]
		if (childNode) {
			const escapedChar = c
			const childPattern = convertToPattern(childNode)
			if (childPattern != null) {
				alt.push(escapedChar + childPattern)
			} else {
				cc.push(escapedChar)
			}
		}
	}

	const ccOnly = alt.length == 0

	if (cc.length > 0) {
		if (cc.length == 1) {
			alt.push(cc[0])
		} else {
			alt.push(`[${cc.join()}]`)
		}
	}
	let result: string
	if (alt.length == 1) {
		result = alt[0]
	} else {
		result = `(?:${alt.join("|")})`
	}

	if (node.leaf) {
		if (ccOnly) {
			result += "?"
		} else {
			result = `(?:${result})?`
		}
	}

	return result
}

function* iterEscapedRegex(escapedRegex: string) {
	let escaped = false
	for (let i = 0; i < escapedRegex.length; ++i) {
		if (escaped) {
			escaped = false
			yield `\\${escapedRegex[i]}`
		} else {
			if (escapedRegex[i] == "\\") {
				escaped = true
			} else {
				yield escapedRegex[i]
			}
		}
	}
}

export function buildTrieRegex(substrings: string[]) {
	const root: RegexTrieNode = { children: {} }

	for (const substring of substrings) {
		let buildNode = root
		for (const c of iterEscapedRegex(substring)) {
			if (buildNode.children[c]) {
				buildNode = buildNode.children[c]
			} else {
				const newNode: RegexTrieNode = {
					children: {},
				}

				buildNode.children[c] = newNode
				buildNode = newNode
			}
		}
		buildNode.leaf = true
	}

	const pattern = convertToPattern(root)

	if (!pattern) return ""
	return pattern
}
