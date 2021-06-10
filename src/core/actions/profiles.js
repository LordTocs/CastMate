const fs = require("fs");
const YAML = require("yaml");
const path = require("path");
const { userFolder } = require("../utils/configuration");
const logger = require("../utils/logger");

function loadFile(filename, fileset, root = userFolder)
{
	const adjustedFilename = path.join(root, filename);
	let contents = fs.readFileSync(adjustedFilename, "utf-8");
	let pojo = YAML.parse(contents);
	fileset.add(adjustedFilename);
	return pojo;
}

function loadActionable(actionable, fileset)
{
	if (actionable instanceof Array)
	{
		for (let i = 0; i < actionable.length; ++i)
		{
			let action = actionable[i];
			if ("import" in action)
			{
				try
				{
					let actionsInsert = loadFile(action["import"], fileset);
					if (!(actionsInsert instanceof Array))
					{
						logger.error(`Imports in the middle of action arrays must be arrays themselves.`);
						throw new Error("Imports in the middle of action arrays must be arrays themselves");
					}

					//Handle recursive imports
					loadActionable(actionsInsert, fileset);

					actionable.splice(i, 1, ...actionsInsert);

					i += actionsInsert.length - 1;
				}
				catch (err)
				{
					logger.error(`Unable to load file ${action["import"]}`);
					throw err;
				}
			}
		}
	}
	else if ("actions" in actionable)
	{
		loadActionable(actionable.actions, fileset);
	}
	else if ("oneOf" in actionable)
	{
		for (let subActions of actionable.oneOf)
		{
			loadActionable(subActions, fileset);
		}
	}
}

function loadTrigger(triggerObj, fileset)
{
	for (let trigger in triggerObj)
	{
		if (trigger == "imports")
			continue;

		loadActionable(triggerObj[trigger], fileset)
	}

	if ("imports" in triggerObj)
	{
		let importFiles = triggerObj.imports;
		if (!(importFiles instanceof Array))
		{
			throw new Error("'imports' expects an array of filenames");
		}

		for (let filename of importFiles)
		{
			try
			{
				let importedTriggers = loadFile(filename, fileset);
				for (let trigger in importedTriggers)
				{
					loadActionable(importedTriggers[trigger], fileset);
				}
				Object.assign(triggerObj, importedTriggers);
			}
			catch (err)
			{
				logger.error(`Unable to load file ${filename}`);
				throw err;
			}
		}

		delete triggerObj.imports;
	}
}

class Profile
{
	constructor(filename, onReload)
	{
		this.filename = filename;
		this.triggers = {};
		this.conditions = {};
		this.watchers = [];
		this.onReload = onReload;
		this.rewards = [];
		this.dependencies = null;
		try
		{
			this.reload();
		}
		catch (err)
		{
			//Catch this error here, so initial construction of profiles doesn't error out.
			//Otherwise it will break hotreloading if the profile is fixed.
			logger.error(`Initial Loading of ${filename} failed.`);
		}
	}

	reload()
	{
		let fileset = new Set();
		this.dependencies = fileset;

		logger.info(`Loading Profile: ${this.filename}`);
		let profileConfig;
		try
		{
			profileConfig = loadFile(this.filename, fileset, ".");

			if (profileConfig.triggers)
			{
				for (let trigger in profileConfig.triggers)
				{
					loadTrigger(profileConfig.triggers[trigger], fileset);
				}
			}
		}
		catch (err)
		{
			logger.error(`Unable to load file ${this.filename}`);
			throw err;
		}

		this.triggers = profileConfig.triggers;
		this.conditions = profileConfig.conditions || {};
		this.config = profileConfig;
	}

	async handleFileChanged(filename)
	{
		if (this.dependencies.has(filename))
		{
			this.reload();
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

module.exports = { Profile, loadActionable };