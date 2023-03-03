import fs from "fs"
import YAML from "yaml"
import path from "path"
import logger from "../utils/logger.js"
import { migrateProfile } from "../migration/migrate.js"
import { nanoid } from "nanoid/non-secure"
function ensureIDs(config) {
	for (let pluginKey in config.triggers) {
		const pluginObj = config.triggers[pluginKey]
		for (let triggerKey in pluginObj) {
			const triggerArray = pluginObj[triggerKey]
			for (let trigger of triggerArray) {
				if (!trigger.id) {
					trigger.id = nanoid()
				}
			}
		}
	}
}

export class Profile {
	constructor(filename, manager, onReload) {
		this.filename = filename
		this.name = path.basename(filename, ".yaml")
		this.manager = manager
		this.triggers = {}
		this.conditions = { operator: "any", operands: [] }
		this.watchers = []
		this.onReload = onReload
		this.rewards = []
		this.onDeactivate = null
		this.onActivate = null
		this.config = {}
	}

	async load() {
		logger.info(`Loading Profile: ${this.filename}`)

		let profileConfig
		try {
			profileConfig = YAML.parse(
				await fs.promises.readFile(this.filename, "utf-8")
			)
		} catch (err) {
			logger.error(`Unable to load file ${this.filename}`)
			throw err
		}

		if (!profileConfig) {
			logger.error(`Profile file ${this.filename} is empty!`)
			profileConfig = {}
		}

		profileConfig = await migrateProfile(profileConfig, this.filename)

		ensureIDs(profileConfig)

		await this.reloadConfig(profileConfig)
	}

	async rename(newName, newFilename) {
		await fs.promises.rename(this.filename, newFilename)

		this.name = newName
		this.filename = newFilename

		await this.reloadConfig(this.config)
		this.onReload(this)
	}

	async saveConfig(profileConfig) {
		logger.info(`Saving Profile: ${this.name}`)

		try {
			await fs.promises.writeFile(
				this.filename,
				YAML.stringify(profileConfig || {}),
				"utf-8"
			)
		} catch (err) {
			logger.error(`Unable to load file ${this.filename}`)
			throw err
		}

		await this.reloadConfig(profileConfig)
		this.onReload(this)
	}

	async reloadConfig(profileConfig) {
		logger.info(`Reloading Profile: ${this.name}`)

		this.config = profileConfig

		this.triggers = profileConfig.triggers || {}

		//Label all the triggers with their origin profile
		for (let pluginKey in this.triggers) {
			for (let triggerKey in this.triggers[pluginKey]) {
				for (let mapping of this.triggers[pluginKey][triggerKey]) {
					mapping.profile = this.name
				}
			}
		}

		this.conditions = profileConfig.conditions || {
			operator: "any",
			operands: [],
		}

		this.onActivate = profileConfig.onActivate
		this.onDeactivate = profileConfig.onDeactivate
	}
}

Profile.mergeTriggers = function (profiles) {
	let combined = {}

	for (let profile of profiles) {
		for (let plugin in profile.triggers) {
			if (!(plugin in combined)) {
				combined[plugin] = {}
			}

			for (let trigger in profile.triggers[plugin]) {
				if (!(trigger in combined[plugin])) {
					combined[plugin][trigger] = []
				}
				combined[plugin][trigger] = combined[plugin][trigger].concat(
					profile.triggers[plugin][trigger]
				)
			}
		}
	}

	return combined
}
