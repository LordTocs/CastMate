import { IPCSchema, Schema, SchemaBase, SchemaObj, getTypeByName, registerType } from "../schema"
import { escapeRegExp } from "../util/substring-helper"

export type CommandMode = "command" | "string" | "regex"

export interface CommandArgument {
	id: string
	name: string
	schema: {
		type: string
		[key: string]: any
	}
}

export interface CommandModeCommand {
	match: string
	mode: "command"
	arguments: CommandArgument[]
	hasMessage: boolean
}

export interface StringModeCommand {
	match: string
	mode: "string"
	leftBoundary: boolean
	rightBoundary: boolean
}

export interface RegexModeCommand {
	match: string
	mode: "regex"
}

export type Command = CommandModeCommand | StringModeCommand | RegexModeCommand

const CommandSymbol = Symbol()

export interface CommandFactory {
	factoryCreate(): Command
	[CommandSymbol]: true
}

export const Command: CommandFactory = {
	factoryCreate(): Command {
		return {
			mode: "command",
			match: "",
			arguments: [],
			hasMessage: false,
		} satisfies CommandModeCommand
	},
	[CommandSymbol]: true,
}

export interface SchemaCommand extends SchemaBase<Command> {
	type: CommandFactory
}

declare module "../schema" {
	interface SchemaTypeMap {
		Command: [SchemaCommand, Command]
	}
}

registerType("Command", {
	constructor: Command,
})

export function getCommandInfoString(command: Command | undefined) {
	if (command == null) return ""

	if (command.mode == "command") {
		let result = command.match

		if (command.arguments.length > 0) {
			result +=
				" " +
				command.arguments
					.filter((a) => a.name.length > 0)
					.map((a) => `<${a.name}>`)
					.join(" ")
		}

		if (command.hasMessage) {
			result += " <...message...>"
		}

		return result
	} else if (command.mode == "string") {
		return `...${command.leftBoundary ? " " : ""}${command.match}${command.rightBoundary ? " " : ""}...`
	} else if (command.mode == "regex") {
		return `RegEx: ${command.match}`
	}
}

interface ParseContext {
	index: number
}

function isWhitespace(char: string) {
	return char == " " || char == "\t"
}

function skipWhitespace(str: string, parse: ParseContext) {
	while (parse.index < str.length && isWhitespace(str[parse.index])) {
		parse.index++
	}
}

function expectWhitespace(str: string, parse: ParseContext) {
	let count = 0

	if (parse.index >= str.length) return true

	while (parse.index < str.length && isWhitespace(str[parse.index])) {
		parse.index++
		count++
	}

	return count > 0
}

export async function parseArgs(
	argString: string,
	command: CommandModeCommand,
	parse: ParseContext
): Promise<Record<string, any> | undefined> {
	let result: Record<string, any> = {}

	//console.log(`Parse Args "${argString}"`)

	for (const arg of command.arguments) {
		skipWhitespace(argString, parse)

		if (parse.index >= argString.length) return undefined

		let beginning = parse.index
		let end: number

		if (argString[parse.index] == '"') {
			//do the string thing
			parse.index++

			beginning = parse.index

			while (parse.index < argString.length && argString[parse.index] != '"') {
				parse.index++
			}
			if (parse.index >= argString.length) {
				//We ran out!
				return undefined
			}
			end = parse.index
			parse.index++ //Step past the closing "
		} else {
			//just a word
			while (parse.index < argString.length && !isWhitespace(argString[parse.index])) {
				parse.index++
			}
			end = parse.index
		}

		const localString = argString.substring(beginning, end)

		if (localString.length == 0) return undefined

		const dataType = getTypeByName(arg.schema.type)
		if (!dataType) return undefined

		const parsed = await dataType?.fromString?.(localString)
		if (parsed == undefined) return undefined

		result[arg.name] = parsed
	}

	if (command.hasMessage) {
		skipWhitespace(argString, parse)

		if (parse.index >= argString.length) return undefined

		result["commandMessage"] = argString.substring(parse.index)
		parse.index = argString.length
	}

	return result
}

export async function matchAndParseCommand(
	message: string,
	command: Command
): Promise<Record<string, any> | undefined> {
	if (command.mode == "command") {
		const commandLower = command.match.toLocaleLowerCase()
		if (!message || !message.toLocaleLowerCase().startsWith(commandLower)) return undefined

		let parse: ParseContext = { index: commandLower.length }

		if (!expectWhitespace(message, parse)) {
			return undefined
		}

		const argValues = await parseArgs(message, command, parse)

		if (!argValues) return undefined

		//console.log("Arg Values", argValues)

		if (!expectWhitespace(message, parse)) {
			return undefined
		}
		if (parse.index != message.length) return undefined

		return argValues
	} else if (command.mode == "string") {
		const regexp = new RegExp(
			`${command.leftBoundary ? "\\b" : ""}${escapeRegExp(command.match)}${command.rightBoundary ? "\\b" : ""}`,
			"g"
		)
		if (message.match(regexp)) {
			return {}
		}
		return undefined
	} else if (command.mode == "regex") {
		const regexp = new RegExp(command.match)
		const matchResult = message.match(regexp)
		if (matchResult != null) {
			return matchResult
		}
		return undefined
	}

	//@ts-ignore
	throw new Error(`Unknown Command Mode ${command.mode}`)
}

export function getCommandDataSchema(command: Command): SchemaObj {
	if (command.mode == "string") return { type: Object, properties: {} }
	if (command.mode == "regex") {
		return {
			type: Object,
			properties: {
				matches: { type: Array, items: { type: String, required: true }, required: true },
			},
		}
	}
	if (command.mode == "command") {
		const result: SchemaObj = {
			type: Object,
			properties: {},
		}

		for (const arg of command.arguments) {
			const type = getTypeByName(arg.schema.type)

			if (!type) continue

			result.properties[arg.name] = {
				...arg.schema,
				type: type?.constructor,
				required: true,
			} as unknown as Schema
		}

		if (command.hasMessage) {
			result.properties.commandMessage = {
				type: String,
				required: true,
			}
		}

		return result
	}

	//@ts-ignore
	throw new Error(`Unknown Command Mode: ${command.mode}`)
}
