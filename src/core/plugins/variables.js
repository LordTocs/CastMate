const { createReactiveProperty } = require("../utils/reactive.js");
module.exports = {
	name: "variables",
	async init()
	{

	},
	onProfileLoad(profile, config)
	{
		let needsDependencyUpdate = false;
		for (let variable in config.variables)
		{
			let variableSpec = config.variables[variable];

			let defaultValue = variableSpec.default;

			if (defaultValue == undefined)
			{
				if (variableSpec.type && variableSpec.type == "string")
				{
					defaultValue = "";
				}
				else
				{
					defaultValue = 0;
				}
			}

			if (!(variable in this.state))
			{
				//Trigger creation here.
				this.createVariable(variable, defaultValue);
				needsDependencyUpdate = true;
			}
		}

		if (needsDependencyUpdate)
		{
			this.profiles.redoDependencies();
		}
	},
	methods: {
		createVariable(name, value)
		{
			this.state[name] = value
			createReactiveProperty(this.state, name);
			this.plugins.updateReactivity(this);
		}
	},
	settings: {
	},
	secrets: {
	},
	actions: {
		variable: {
			name: "Change Variable",
			data: {
				type: Object,
				properties: {
					name: { type: String, name: "Variable Name" },
					set: { type: String, name: "Set Value" },
					offset: { type: String, name: "Offset Value" },
				}
			},
			async handler(variableData)
			{
				if (!variableData.name)
					return;

				if (!(variableData.name in this.state))
					return;

				if ("set" in variableData)
				{
					//Set the value

					this.state[variableData.name] = variableData.set;
				}
				else if ("offset" in variableData)
				{
					//Add the value
					this.state[variableData.name] += variableData.offset;
				}
			}
		}
	}
}