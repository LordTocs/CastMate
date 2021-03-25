const { reactify } = require("./reactive");
const { cleanSchemaForIPC } = require("./schema");

class Plugin
{
	constructor(config)
	{
		this.pluginObj = {};

		this.name = config.name;
		console.log(`Loading Plugin: ${config.name}`);
		this.initFunc = config.init;
		//Bind the init func to the pluginObj
		if (this.initFunc)
		{
			this.initFunc = this.initFunc.bind(this.pluginObj);
		}
		
		this.onSettingsReload = config.onSettingsReload;
		if (this.onSettingsReload)
		{
			this.onSettingsReload = this.onSettingsReload.bind(this.pluginObj);
		}

		this.onProfilesChanged = config.onProfilesChanged;

		if (this.onProfilesChanged)
		{
			this.onProfilesChanged = this.onProfilesChanged.bind(this.pluginObj);
		}

		this.onProfileLoad = config.onProfileLoad;

		if (this.onProfileLoad)
		{
			this.onProfileLoad = this.onProfileLoad.bind(this.pluginObj);
		}

		this.onSecretsReload = config.onSecretsReload;

		if (this.onSecretsReload)
		{
			this.onSecretsReload = this.onSecretsReload.bind(this.pluginObj);
		}

		this.onWebsocketMessage = config.onWebsocketMessage;

		if (this.onWebsocketMessage)
		{
			this.onWebsocketMessage = this.onWebsocketMessage.bind(this.pluginObj);
		}

		this.settings = config.settings || [];
		this.secrets = config.secrets || [];
		this.triggers = config.triggers || [];
		this.actions = {};

		//Pass the methods onto the plugin object for use.
		if (config.methods)
		{
			Object.assign(this.pluginObj, config.methods);
		}

		//Bind all the action handlers to the pluginObj so 'this' works correctly.
		for (let actionKey in config.actions)
		{
			let action = config.actions[actionKey];
			if (action.handler)
			{
				action.handler = action.handler.bind(this.pluginObj);
			}
			this.actions[actionKey] = action;
		}

		this.templateFunctions = {};
		for (let funcKey in config.templateFunctions)
		{
			let func = config.templateFunctions[funcKey];
			func = func.bind(this.pluginObj);
			this.templateFunctions[funcKey] = func;
		}

		//Create all the state.
		this.pluginObj.state = {};
		for (let stateKey in config.state)
		{
			this.pluginObj.state[stateKey] = null;
		}
		reactify(this.pluginObj.state);
	}

	async init(settings, secrets, actions, profiles, webServices, plugins)
	{
		let pluginSettings = settings.data[this.name] || {};
		let pluginSecrets = secrets.data[this.name] || {};

		this.pluginObj.settings = pluginSettings;
		this.pluginObj.secrets = pluginSecrets;
		this.pluginObj.webServices = webServices;
		this.pluginObj.actions = actions;
		this.pluginObj.profiles = profiles;
		this.pluginObj.plugins = plugins;

		if (this.initFunc)
		{
			await this.initFunc();
		}
	}

	async updateSettings(newSettings, oldSettings)
	{
		if (this.onSettingsReload) {
			let newPluginSettings = newSettings[this.name] || {};
			let oldPluginSettings = oldSettings[this.name] || {};
			this.pluginObj.settings = newPluginSettings;
			if (!_.isEqual(newPluginSettings, oldPluginSettings)) {
				this.onSettingsReload(newPluginSettings, oldPluginSettings);
			}
		} 
	}

	async updateSecrets(newSecrets, oldSecrets)
	{
		if (this.onSecretsReload) {
			let newPluginSecrets = newSecrets[this.name] || {};
			let olgPluginSecrets = oldSecrets[this.name] || {};
			this.pluginObj.pluginSecrets = newPluginSecrets;
			if (!_.isEqual(newPluginSecrets, olgPluginSecrets)) {
				this.onSettingsReload(newPluginSecrets, olgPluginSecrets);
			}
		} 
	}

	getUIDescription()	{
		let actions = {};

		for (let actionKey in this.actions)
		{
			actions[actionKey] = {
				name: this.actions[actionKey].name,
				description: this.actions[actionKey].description,
				data: cleanSchemaForIPC(this.actions[actionKey].data)
			}
		}

		let settings = {};

		//convert all types to strings
		for (let settingsKey in this.settings)
		{
			settings[settingsKey] = { ...this.settings[settingsKey] };
			settings[settingsKey].type = settings[settingsKey].type.name;
		}

		let secrets = {};

		//convert all types to strings
		for (let secretsKey in this.secrets)
		{
			secrets[secretsKey] = { ...this.secrets[secretsKey] };
			secrets[secretsKey].type = secrets[secretsKey].type.name;
		}

		//Todo: State.

		return {
			name: this.name,
			settings,
			secrets,
			triggers: this.triggers,
			actions
		}
	}

}

module.exports = {
	Plugin
}