import { IPCSchema, SchemaBase, registerType } from "../schema"

export type CommandMode = "command" | "string" | "regex"

export interface CommandArgument {
	id: string
	name: string
	schema: {
		type: string
		[key: string]: any
	}
}

export interface Command {
	match: string
	mode: CommandMode
	arguments: CommandArgument[]
	hasMessage: boolean
}

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
		}
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
		return `...${command.match}...`
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

export async function parseArgs(argString: string, command: Command): Promise<Record<string, any> | undefined> {
	let result: Record<string, any> = {}

	let parse: ParseContext = { index: 0 }

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
		} else {
			//just a word
			while (parse.index < argString.length && !isWhitespace(argString[parse.index])) {
				parse.index++
			}
			end = parse.index
		}

		const localString = argString.substring(beginning, end)

		if (localString.length == 0) return undefined

		//TODO: Parse from string to type
		const parseFailed = false
		if (parseFailed) {
			return undefined
		}

		result[arg.name] = localString
	}

	if (command.hasMessage) {
		skipWhitespace(argString, parse)

		result["commandMessage"] = argString.substring(parse.index)
	}

	return result
}

export async function matchAndParseCommand(
	message: string,
	command: Command
): Promise<Record<string, any> | undefined> {
	if (command.mode == "command") {
		if (!message || !message.toLocaleLowerCase().startsWith(command.match.toLocaleLowerCase())) return undefined

		return await parseArgs(message.substring(command.match.length + 1), command)
	} else if (command.mode == "string") {
		if (message.toLocaleLowerCase().includes(command.match.toLocaleLowerCase())) {
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

	throw new Error(`Unknown Command Mode ${command.mode}`)
}
