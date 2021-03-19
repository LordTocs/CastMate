const { createReactiveProperty } = require("../utils/reactive.js");
const { evalTemplate } = require('../utils/template');

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
		},
		handleTemplateNumber(value, context)
		{
			if (typeof value === 'string' || value instanceof String)
			{
				return evalTemplate(value, context)
			}
			return value;
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
			async handler(variableData, context)
			{
				if (!variableData.name)
					return;

				if (!(variableData.name in this.state))
					return;

				if ("set" in variableData)
				{
					//Set the value
					let setValue = variableData.set;
					if (typeof this.state[variableData.name] == 'number' || this.state[variableData.name] instanceof Number)
					{
						setValue = this.handleTemplateNumber(setValue, context);
					}
					this.state[variableData.name] = setValue;
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