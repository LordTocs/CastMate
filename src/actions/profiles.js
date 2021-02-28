const fs = require("fs");
const YAML = require("yaml");

function loadFile(filename, fileset)
{
	console.log(`Loading ${filename}`);
	let pojo = YAML.parse(fs.readFileSync(filename, "utf-8"));
	fileset.add(filename);
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
				let actionsInsert = loadFile(action["import"], fileset);
				if (!(actionsInsert instanceof Array))
				{
					throw new Error("Imports in the middle of action arrays must be arrays themselves");
				}

				//Handle recursive imports
				loadActionable(actionsInsert, fileset);

				actionable.splice(i, 1, ...actionsInsert);

				i += actionsInsert.length - 1;
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
			let importedTriggers = loadFile(filename, fileset);
			for (let trigger in importedTriggers)
			{
				loadActionable(importedTriggers[trigger], fileset);
			}
		}
	}
}

class Profile
{
	constructor(filename, onReload)
	{
		this.filename = filename;
		this.triggers = {};
		this.name = "";
		this.conditions = {};
		this.watchers = [];
		this.onReload = onReload;
		this.rewards = [];
		this.reload();
	}

	reload()
	{
		let fileset = new Set();

		let profileConfig = loadFile(this.filename, fileset);

		if (profileConfig.triggers)
		{
			for (let trigger in profileConfig.triggers)
			{
				loadTrigger(profileConfig.triggers[trigger], fileset);
			}
		}

		this.name = profileConfig.name || "Anon Profile";
		this.triggers = profileConfig.triggers;
		this.conditions = profileConfig.conditions || {};
		this.config = profileConfig;
		
		//Setup reloads
		let filearray = Array.from(fileset);

		for (let watcher of this.watchers)
		{
			watcher.close();
		}

		this.watchers = filearray.map((filename) => fs.watch(filename, () =>
		{
			try
			{
				console.log(`Reloading Profile ${this.name}`);
				this.reload();
				this.onReload(this);
			}
			catch (err)
			{
				console.error(`Error Loading Profile ${this.name}`)
			}
		}))
	}
}

Profile.mergeTriggers = function(profiles)
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