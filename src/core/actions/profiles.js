const fs = require("fs");
const YAML = require("yaml");
const path = require("path");
const { userFolder } = require("../utils/configuration");
const logger = require("../utils/logger");
const { migrateProfile } = require("../migration/migrate");

class Profile {
	constructor(filename, manager, onReload) {
		this.filename = filename;
		this.name = path.basename(filename, ".yaml");
		this.manager = manager;
		this.triggers = {};
		this.conditions = { operator: 'any', operands: [] };
		this.watchers = [];
		this.onReload = onReload;
		this.rewards = [];
		this.onDeactivate = null;
		this.onActivate = null;
	}

	async reload() {
		logger.info(`Loading Profile: ${this.filename}`);

		let profileConfig;
		try {
			profileConfig = YAML.parse(await fs.promises.readFile(this.filename, 'utf-8'))
		}
		catch (err) {
			logger.error(`Unable to load file ${this.filename}`);
			throw err;
		}

		profileConfig = await migrateProfile(profileConfig, this.filename);

		if (!profileConfig) {
			logger.error(`Profile file ${this.filename} is empty!`)
			profileConfig = {};
		}

		this.triggers = profileConfig.triggers || {};

		//Label all the triggers with their origin profile
		for (let pluginKey in this.triggers) {
			for (let triggerKey in this.triggers[pluginKey]) {
				for (let mapping of this.triggers[pluginKey][triggerKey]) {
					mapping.profile = this.name;
				}
			}
		}

		this.conditions = profileConfig.conditions || { operator: 'any', operands: [] };
		this.config = profileConfig;
		this.onActivate = profileConfig.onActivate;
		this.onDeactivate = profileConfig.onDeactivate;
	}

	async handleFileChanged(filename) {
		if (this.filename == filename) {
			await this.reload();
			this.onReload(this);
		}
	}
}

Profile.mergeTriggers = function (profiles) {
	let combined = {};

	for (let profile of profiles) {
		for (let plugin in profile.triggers) {
			if (!(plugin in combined)) {
				combined[plugin] = {};
			}

			for (let trigger in profile.triggers[plugin]) {

				if (!(trigger in combined[plugin])) {
					combined[plugin][trigger] = [];
				}
				combined[plugin][trigger] = combined[plugin][trigger].concat(profile.triggers[plugin][trigger]);
			}
		}

	}

	return combined;
}

module.exports = { Profile };