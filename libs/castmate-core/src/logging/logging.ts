import winston from "winston"
import util from "util"
import { initingPlugin } from "../plugins/plugin"
import { ensureDirectory, resolveProjectPath } from "../io/file-system"
import fs from "fs"
import colors from "@colors/colors"

const fileLogFormat = winston.format.printf((info) => {
	const timestamp = info.timestamp
	const plugin = info.label
	const level = info.level
	const message = info.message

	return `${timestamp} [${plugin}] ${level}: ${message}`
})

const shortHands: Record<string, string> = {
	info: colors.blue("log"),
	error: colors.red("err"),
}

const consoleLogFormat = winston.format.printf((info) => {
	const plugin: string = info.plugin
	const level = info.level
	const message = info.messageColored

	return `${plugin.padStart(11, " ")}:${shortHands[level]}: ${message}`
})

export let winstonLogger: winston.Logger

export async function initializeLogging() {
	const logDir = resolveProjectPath("logs")
	await ensureDirectory(logDir)

	const initTime = Date.now()

	const logFileName = `castmate-log-${initTime}.log`

	//Delete oldest log if there's more than 10
	const logFiles = fs.readdirSync(logDir)
	if (logFiles.length >= 10) {
		logFiles.sort()
		fs.rmSync(resolveProjectPath("logs", logFiles[0]))
	}

	winstonLogger = winston.createLogger({
		level: "info",
		defaultMeta: {
			plugin: "global",
		},
		transports: [
			new winston.transports.Console({
				format: winston.format.combine(consoleLogFormat),
			}),
			new winston.transports.File({
				filename: resolveProjectPath("logs", logFileName),
				format: winston.format.combine(winston.format.timestamp(), fileLogFormat),
			}),
		],
	})
}

export interface Logger {
	log(...args: any[]): void
	error(...args: any[]): void
}

function logArg(arg: any) {
	if (typeof arg == "string") return arg
	return util.inspect(arg)
}

function logArgColored(arg: any) {
	if (typeof arg == "string") return arg
	return util.inspect(arg, false, 2, true)
}

export const globalLogger: Logger = {
	log(...args: any[]) {
		winstonLogger?.log("info", args.map(logArg).join(" "), { messageColored: args.map(logArgColored).join(" ") })
	},
	error(...args: any[]) {
		winstonLogger?.log("error", args.map(logArg).join(" "), { messageColored: args.map(logArgColored).join(" ") })
	},
}

export function usePluginLogger(pluginId?: string) {
	if (pluginId == null && !initingPlugin) {
		throw new Error("Must be used in plugin init")
	}

	if (initingPlugin && pluginId == null) {
		pluginId = initingPlugin.id
	}

	const finalPluginId = pluginId

	const logger: Logger = {
		log(...args) {
			winstonLogger?.log("info", args.map(logArg).join(" "), {
				plugin: finalPluginId,
				messageColored: args.map(logArgColored).join(" "),
			})
		},
		error(...args) {
			winstonLogger?.log("error", args.map(logArg).join(" "), {
				plugin: finalPluginId,
				messageColored: args.map(logArgColored).join(" "),
			})
		},
	}

	return logger
}
