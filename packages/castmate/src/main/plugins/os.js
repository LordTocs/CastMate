import path from "path"
import { evalTemplate, getNextTemplate, template } from "../state/template"
import { exec } from "child_process"

async function shellCommand(command) {
	return new Promise((resolve, reject) => {
		exec(command, (err, stdout, stderr) => {
			if (err) reject(err)
			resolve(stdout)
		})
	})
}

async function powershellCommand(command, workingDir) {
	return new Promise((resolve, reject) => {
		exec(
			command,
			{ shell: "powershell.exe", cwd: workingDir },
			(err, stdout, stderr) => {
				if (err) reject(err)
				resolve(stdout)
			}
		)
	})
}

const SINGLE_QUOTE = "'"
const DOUBLE_QUOTE = '"'
const BACK_TICK = "`"

const singleQuotes = ["'", "\u2018", "\u2019", "\u201A", "\u201B"]
const doubleQuotes = ['"', "\u201C", "\u201D", "\u201E"]
const dashes = ["-", "\u2013", "\u2014", "\u2015"]

function isSingleQuote(char) {
	return singleQuotes.includes(char)
}

function isDoubleQuote(char) {
	return doubleQuotes.includes(char)
}

function powershellEscapeForSingleQuote(str) {
	let result = ""

	for (let c of str) {
		if (singleQuotes.includes(c)) {
			result += c
		}
		result += c
	}

	return result
}

function powershellEscapeForDoubleQuote(str) {
	let result = ""
	const specialCharacters = [...doubleQuotes, "`", "$"]

	for (let c of str) {
		if (specialCharacters.includes(c)) {
			result += "`"
		}
		result += c
	}

	return result
}

function powershellEscapeWild(str) {
	let result = ""
	const specialCharacters = [...doubleQuotes, ...singleQuotes, "`", ...dashes, "%", "|", "$", "{", "}", "?"]

	for (let c of str) {
		if (specialCharacters.includes(c)) {
			result += "`"
		}
		result += c
	}

	return result
}

function trackPowershellString(filler, parseContext) {
	for (let i = 0; i < filler.length; ++i) {
		const c = filler[i]
		if (parseContext.strType == SINGLE_QUOTE) {
			//In a ' string the only escape character is ' since everything else is verbatum

			if (isSingleQuote(c)) {
				const next = filler[i + 1]
				if (isSingleQuote(next)) {
					i++
				} else {
					parseContext.strType = null
				}
			}
		} else if (parseContext.strType == DOUBLE_QUOTE) {
			//In a " string ` escaping works as well as "" escaping
			if (isDoubleQuote(c)) {
				const next = filler[i + 1]
				if (isDoubleQuote(next)) {
					i++
				} else {
					parseContext.strType = null
				}
			} else if (c == BACK_TICK) {
				i++
			}
		} else {
			if (isSingleQuote(c)) {
				parseContext.strType = SINGLE_QUOTE
			} else if (isDoubleQuote(c)) {
				parseContext.strType = DOUBLE_QUOTE
			}
		}
	}
}

async function powershellTemplate(templateStr, data) {
	let resultStr = ""
	let searchStart = 0

	const parseContext = {
		strType: null, //Indicates what type of powershell string we're in ' or "
	}

	while (true) {
		const { filler, template, endIndex } = getNextTemplate(
			templateStr,
			searchStart
		)

		trackPowershellString(filler, parseContext)
		resultStr += filler

		if (!template) {
			break
		}

		let templateResult = undefined
		try {
			templateResult = String(await evalTemplate(template, data))
		} catch {}

		if (parseContext.strType == SINGLE_QUOTE) {
			templateResult = powershellEscapeForSingleQuote(templateResult)
		} else if (parseContext.strType == DOUBLE_QUOTE) {
			templateResult = powershellEscapeForDoubleQuote(templateResult)
		} else {
			templateResult = powershellEscapeWild(templateResult)
		}

		resultStr += templateResult
		searchStart = endIndex + 1
	}

	return resultStr
}

export default {
	name: "os",
	uiName: "OS",
	icon: "mdi-laptop",
	color: "#CC9B78",
	async init() {},
	actions: {
		shell: {
			name: "Powershell Command",
			description: "Execute's a powershell command",
			data: {
				type: Object,
				properties: {
					command: {
						type: "String",
						template: true,
						name: "Command",
					},
					dir: {
						type: "Folder",
						name: "Working Directory",
					},
				},
			},
			icon: "mdi-application-cog-outline",
			color: "#CC9B78",
			async handler(data, context) {
				const command = await powershellTemplate(data.command, context)

				console.log("Final PowerShell Command: ", command)

				const result = await powershellCommand(command, data.dir)

				console.log(result)
			},
		},
	},
}
