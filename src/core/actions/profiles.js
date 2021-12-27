const fs = require("fs");
const YAML = require("yaml");
const path = require("path");
const { userFolder } = require("../utils/configuration");
const logger = require("../utils/logger");
const { CommandTriggerHandler } = require("./command-trigger-handler");
const { NumberTriggerHandler } = require("./number-trigger-handler");
const { SingleTriggerHandler } = require("./single-trigger-handler");

function loadFile(filename, fileset, root = userFolder)
{
	const adjustedFilename = path.join(root, filename);
	let contents = fs.readFileSync(adjustedFilename, "utf-8");
	let pojo = YAML.parse(contents);
	fileset.add(adjustedFilename);
	return pojo;
}

class Profile
{
	constructor(filename, manager, onReload)
	{
		this.filename = filename;
		this.name = path.basename(filename, ".yaml");
		this.manager = manager;
		this.triggers = {};
		this.conditions = { operator: 'any', operands: []};
		this.watchers = [];
		this.onReload = onReload;
		this.rewards = [];
		this.onDeactivate = null;
		this.onActivate = null;
	}

	async reload()
	{
		logger.info(`Loading Profile: ${this.filename}`);

		let profileConfig;
		try
		{
			profileConfig = YAML.parse(await fs.promises.readFile(this.filename, 'utf-8'))
		}
		catch (err)
		{
			logger.error(`Unable to load file ${this.filename}`);
			throw err;
		}

		if (!profileConfig)
		{
			logger.error(`Profile file ${this.filename} is empty!`)
			profileConfig = {};
		}

		this.triggers = profileConfig.triggers || {};
		this.conditions = profileConfig.conditions || { operator: 'any', operands: []};
		this.config = profileConfig;
		this.onActivate = profileConfig.onActivate;
		this.onDeactivate = profileConfig.onDeactivate;
	}

	async handleFileChanged(filename)
	{
		if (this.filename == filename)
		{
			await this.reload();
			this.onReload(this);
		}
	}
}

Profile.mergeTriggers = function (profiles)
{
	let combined = {};

	for (let profile of profiles)
	{
		for (let trigger in profile.triggers)
		{
			if (!(trigger in combined))
			{
				combined[trigger] = {};
			}

			for (let subTrigger in profile.triggers[trigger])
			{
				combined[trigger][subTrigger] = profile.triggers[trigger][subTrigger];
			}
		}
	}

	return combined;
}

module.exports = { Profile };