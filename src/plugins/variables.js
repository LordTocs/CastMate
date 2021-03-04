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
	async onWebsocketMessage(msg, connection)
	{
		if ("state" in msg)
		{
			let result = {};
			for (let stateKey of msg.state)
			{
				if (stateKey in this.plugins.combinedState)
				{
					result[stateKey] = this.plugins.combinedState[stateKey];
				}
			}
			connection.send(JSON.stringify({ state: result }));
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