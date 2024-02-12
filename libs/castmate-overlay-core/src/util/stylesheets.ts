import {
	computed,
	onMounted,
	onUnmounted,
	watch,
	ref,
	CSSProperties,
	MaybeRefOrGetter,
	onBeforeUnmount,
	toValue,
} from "vue"

//import { isString } from "./typeHelpers"

import { customAlphabet } from "nanoid/non-secure"

export const styleIdGenerator = customAlphabet("abcdefghijklmnopqrstuvwxyz", 10)

function createStyleString(style: CSSProperties) {
	return Object.entries(style)
		.map(([k, v]) => {
			// if (k == "cssFloat") {
			// 	k = "float"
			// }
			k = k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
			return `${k}:${v}`
		})
		.join(";")
}

export type CSSSheetRules = Record<string, CSSProperties>

export function useDynamicSheet(cssRules: MaybeRefOrGetter<CSSSheetRules>) {
	let sheetElement: HTMLStyleElement | undefined = undefined

	onMounted(() => {
		sheetElement = document.createElement("style")
		sheetElement.type = "text/css"
		document.head.appendChild(sheetElement)

		//Delete the old rules
		if (sheetElement.sheet) {
			for (let i = sheetElement.sheet.cssRules.length - 1; i >= 0; --i) {
				sheetElement.sheet.deleteRule(i)
			}
		}

		watch(
			() => toValue(cssRules),
			(rules) => {
				if (sheetElement == null) return
				if (sheetElement.sheet == null) return

				for (let ruleName in rules) {
					const ruleStr = `${ruleName} { ${createStyleString(rules[ruleName])} }`

					sheetElement.sheet.insertRule(ruleStr, sheetElement.sheet.cssRules.length)
				}
			},
			{ immediate: true, deep: true }
		)
	})

	onBeforeUnmount(() => {
		if (!sheetElement) return
		document.head.removeChild(sheetElement)
	})
}
