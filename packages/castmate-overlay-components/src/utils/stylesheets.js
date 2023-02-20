import { computed, onMounted, onUnmounted, watch, ref } from "vue"

import { isString } from "./typeHelpers"

import { customAlphabet } from "nanoid/non-secure"

export const styleId = customAlphabet("abcdefghijklmnopqrstuvwxyz", 10)

function createStyleString(style) {
	return Object.entries(style)
		.map(([k, v]) => {
			if (k == "cssFloat") {
				k = "float"
			}
			k = k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
			return `${k}:${v}`
		})
		.join(";")
}

class SheetHelper {
	constructor() {
		this.sheetElement = null
		this.sheetRules = ref({})

		this._updateHandle = watch(
			this.sheetRules,
			() => {
				this.setRules()
			},
			{ deep: true }
		)
	}

	setRules() {
		if (!this.sheetElement) return

		//Blow out the rules
		for (let i = this.sheetElement.sheet.cssRules.length - 1; i >= 0; --i) {
			this.sheetElement.sheet.deleteRule(i)
		}

		//Set the new ones.
		for (let key in this.sheetRules.value) {
			const style = this.sheetRules.value[key]

			let ruleStr = null
			if (isString(style)) {
				ruleStr = `${key} {${style}}`
			} else {
				ruleStr = `${key} {${createStyleString(style)}}`
			}

			this.sheetElement.sheet.insertRule(
				ruleStr,
				this.sheetElement.sheet.cssRules.length
			)
		}
	}

	create() {
		this.sheetElement = document.createElement("style")
		this.sheetElement.type = "text/css"
		document.head.appendChild(this.sheetElement)

		this.setRules()
	}

	destroy() {
		document.head.removeChild(this.sheetElement)
	}
}

export function useDynamicSheet() {
	let sheet = new SheetHelper()

	onMounted(() => {
		sheet.create()
	})

	onUnmounted(() => {
		sheet.destroy()
	})

	return sheet
}
