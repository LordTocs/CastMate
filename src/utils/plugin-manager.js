const fs = require('fs');
const { Plugin } = require('./plugin');
const { reactiveCopy } = require('./reactive');

class PluginManager
{
	async load()
	{
		let pluginFiles = await fs.promises.readdir("./src/plugins");

		//Todo: This relative require is weird.
		this.plugins = pluginFiles.map((file) => new Plugin(require(`../plugins/${file}`)));

		this.combinedState = {};

		for (let plugin of this.plugins)
		{
			reactiveCopy(this.combinedState, plugin.pluginObj.state);
		}
	}

	async init(settings, secrets, actions, profiles, webServices)
	{
		for (let plugin of this.plugins)
		{
			await plugin.init(settings, secrets, actions, profiles, webServices);
		}
	}
}

module.exports = { PluginManager }