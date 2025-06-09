import { PowerShellCommand } from "castmate-plugin-os-shared"
import { defineAction, evaluateTemplate, globalLogger, registerSchemaTemplate, usePluginLogger } from "castmate-core"
import { abortablePromise } from "castmate-core/src/util/abort-utils"
import { getTemplateRegionString, parseTemplateString, trimTemplateJS, Directory } from "castmate-schema"
import { ChildProcess, exec, spawn } from "child_process"

//Templating

const SINGLE_QUOTE = "'"
const DOUBLE_QUOTE = '"'
const BACK_TICK = "`"

const singleQuotes = ["'", "\u2018", "\u2019", "\u201A", "\u201B"]
const doubleQuotes = ['"', "\u201C", "\u201D", "\u201E"]
const dashes = ["-", "\u2013", "\u2014", "\u2015"]

function isSingleQuote(char: string) {
	return singleQuotes.includes(char)
}

function isDoubleQuote(char: string) {
	return doubleQuotes.includes(char)
}

function powershellEscapeForSingleQuote(str: string) {
	let result = ""

	for (let c of str) {
		if (singleQuotes.includes(c)) {
			result += c
		}
		result += c
	}

	return result
}

function powershellEscapeForDoubleQuote(str: string) {
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

function powershellEscapeWild(str: string) {
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

interface ParseContext {
	strType: "'" | '"' | null
}

function trackPowershellString(filler: string, parseContext: ParseContext) {
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

function escapePowerShellResult(templateResult: string, parseContext: ParseContext) {
	if (!templateResult) {
		return ""
	}

	if (parseContext.strType == SINGLE_QUOTE) {
		return powershellEscapeForSingleQuote(templateResult)
	} else if (parseContext.strType == DOUBLE_QUOTE) {
		return powershellEscapeForDoubleQuote(templateResult)
	} else {
		return powershellEscapeWild(templateResult)
	}
}

//TODO: Feed to template system
/**
 * Attempts to evaulate {{ templates }} in a powershell command safely. This means that if the {{ template }} is inside of a string, the templated value should not be able to escape the string.
 * @param templateStr
 * @param data
 * @returns
 */
async function powershellTemplate(str: string, data: Record<string, any>) {
	const templateData = parseTemplateString(str)
	let result = ""
	const strContext: ParseContext = { strType: null }
	for (const region of templateData.regions) {
		if (region.type == "string") {
			const filler = getTemplateRegionString(templateData, region)
			trackPowershellString(filler, strContext)
			result += filler
		} else {
			const js = getTemplateRegionString(templateData, region)
			const trimmed = trimTemplateJS(js)
			if (trimmed) {
				let templateResult = undefined
				try {
					templateResult = escapePowerShellResult(String(await evaluateTemplate(trimmed, data)), strContext)
				} catch (err) {
					console.error("Error evaluating Template", err)
					continue
				}

				result += templateResult?.toString() ?? ""
			}
		}
	}

	return result
}

///

async function runPowershellCommand(command: string, workingDir: string | undefined, abortSignal: AbortSignal) {
	return abortablePromise<string>(abortSignal, (resolve, reject, handleAbort) => {
		const process = exec(command, { shell: "powershell.exe", cwd: workingDir }, (err, stdout, stderr) => {
			if (err) reject(err)
			resolve(stdout)
		})

		handleAbort(() => {
			process.kill()
		})
	})
}

registerSchemaTemplate(PowerShellCommand, powershellTemplate)

export function setupPowershell() {
	const logger = usePluginLogger()

	//Note I chose to include powershell commands instead of CMD commands because Powershell actually has string rules that allow escaping.
	//Trying to properly escape a CMD string to avoid malicious behaviour is an exercise in madness.
	//It's also worth noting that the escaping of the {{ templates }} doesn't completely prevent malicious behavior depending on the configured command
	//It's just designed to make sure that if you put at {{ template }} in a string, it won't escape the string as well as any crucial characters are escaped if they're not in strings to try to prevent appending commands.

	defineAction({
		id: "powershell",
		name: "Powershell",
		icon: "mdi mdi-application-cog-outline",
		config: {
			type: Object,
			properties: {
				command: { type: PowerShellCommand, name: "Command", template: true, required: true, default: "" },
				cwd: { type: Directory, name: "Working Directory", template: true },
			},
		},
		result: {
			type: Object,
			properties: {
				processOutput: { type: String, name: "Process Output", required: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			logger.log("Running PS: ", config.command)

			const stdout = await runPowershellCommand(config.command, config.cwd, abortSignal)

			logger.log("Result", stdout)

			return {
				processOutput: stdout,
			}
		},
	})
}
