const { reactify } = require("./reactive");
const { cleanSchemaForIPC } = require("./schema");
const _ = require('lodash');
const { ipcMain } = require("electron");

class Plugin
{
	constructor(config)
	{
		this.pluginObj = {};

		this.name = config.name;
		this.uiName = config.uiName || config.name;
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

		this.settingsView = config.settingsView;

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

		this.ipcMethods = {}
		for (let funcKey in config.ipcMethods)
		{
			this.ipcMethods[funcKey] = config.ipcMethods[funcKey].bind(this.pluginObj);
			ipcMain.handle(`${this.name}_${funcKey}`, async (event, ...args) =>
			{
				return await this.ipcMethods[funcKey](...args);
			})
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
			try
			{
				await this.initFunc();
			} catch (err)
			{
				// TODO: Throw exception to UI
				console.log(`Error loading ${this.name} plugin. Error Msg: ${err}.`)
			}
		}
	}

	async updateSettings(newSettings, oldSettings)
	{
		let newPluginSettings = newSettings[this.name] || {};
		this.pluginObj.settings = newPluginSettings;
		if (this.onSettingsReload)
		{
			let oldPluginSettings = oldSettings[this.name] || {};
			if (!_.isEqual(newPluginSettings, oldPluginSettings))
			{
				this.onSettingsReload(newPluginSettings, oldPluginSettings);
			}
		}
	}

	async updateSecrets(newSecrets, oldSecrets)
	{
		let newPluginSecrets = newSecrets[this.name] || {};
		this.pluginObj.secrets = newPluginSecrets;
		if (this.onSecretsReload)
		{
			console.log("Secrets Changed Plugin: ", this.name);
			let oldPluginSecrets = oldSecrets[this.name] || {};
			if (!_.isEqual(newPluginSecrets, oldPluginSecrets))
			{
				this.onSettingsReload(newPluginSecrets, oldPluginSecrets);
			}
		}
	}

	getUIDescription()
	{
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
			uiName: this.uiName,
			settings,
			secrets,
			triggers: this.triggers,
			actions,
			ipcMethods: Object.keys(this.ipcMethods),
			...this.settingsView ? { settingsView: this.settingsView } : {}
		}
	}

}

module.exports = {
	Plugin
}