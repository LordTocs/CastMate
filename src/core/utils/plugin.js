const { reactify } = require("./reactive");
const { cleanSchemaForIPC, makeIPCEnumFunctions, constructDefaultSchema } = require("./schema");
const _ = require('lodash');
const { ipcMain } = require("electron");
const logger = require('../utils/logger');
const { NumberTriggerHandler } = require("../actions/number-trigger-handler");
const { CommandTriggerHandler } = require("../actions/command-trigger-handler");
const { SingleTriggerHandler } = require("../actions/single-trigger-handler");

const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
class Plugin
{
	constructor(config)
	{
		this.pluginObj = {};

		this.name = config.name;
		this.pluginObj.name = config.name;
		this.uiName = config.uiName || config.name;
		this.color = config.color;
		this.icon = config.icon;
		logger.info(`Loading Plugin: ${config.name}`);
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
		this.triggers = {};

		this.pluginObj.triggers = {};


		/*for (let triggerName in config.triggers)
		{
			const triggerSpec = config.triggers[triggerName];
			this.triggers[triggerName] = { ...triggerSpec };

			const triggerFunc = function (context) {
				return this.actions.trigger(this.name ,triggerName, context || {})
			}
			this.pluginObj.triggers[triggerName] = triggerFunc.bind(this.pluginObj);

			if (triggerSpec.type == 'NumberTrigger')
			{
				this.triggers[triggerName].handler = new NumberTriggerHandler(triggerName, triggerSpec.key || 'number')
			}
			else if (triggerSpec.type == 'CommandTrigger')
			{
				this.triggers[triggerName].handler = new CommandTriggerHandler(triggerName, triggerSpec.key || 'command')
			}
			else if (triggerSpec.type == 'SingleTrigger')
			{
				this.triggers[triggerName].handler = new SingleTriggerHandler(triggerName)
			}
			else if (triggerSpec.type == 'RewardTrigger')
			{
				this.triggers[triggerName].handler = new CommandTriggerHandler(triggerName, triggerSpec.key || 'command')
			}
			else if (triggerSpec.type == 'TimerTrigger')
			{
				this.triggers[triggerName].handler = new CommandTriggerHandler(triggerName, triggerSpec.key || 'command')
			}
			else if (triggerSpec.type == 'EnumTrigger')
			{
				this.triggers[triggerName].handler = new CommandTriggerHandler(triggerName, triggerSpec.key || 'value')

				if (triggerSpec.enum instanceof Function)
				{
					this.triggers[triggerName].enum = triggerSpec.enum.bind(this.pluginObj);

					ipcMain.handle(`${this.name}_trigger_${triggerName}_enum`, (...args) =>
					{
						return this.triggers[triggerName].enum(...args);
					});
				}
				else if (triggerSpec.enum instanceof AsyncFunction)
				{
					this.triggers[triggerName].enum = triggerSpec.enum.bind(this.pluginObj);

					ipcMain.handle(`${this.name}_trigger_${triggerName}_enum`, async (...args) =>
					{
						return await this.triggers[triggerName].enum(...args);
					});
				}
			}
		}*/

		this.setupTriggers(config);

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
			if (action.data)
			{
				makeIPCEnumFunctions(this.pluginObj, this.name + "_action_" + actionKey, action.data);
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
			this.pluginObj[funcKey] = this.ipcMethods[funcKey];
			ipcMain.handle(`${this.name}_${funcKey}`, async (event, ...args) =>
			{
				return await this.ipcMethods[funcKey](...args);
			})
		}

		this.pluginObj.logger = logger;

		for (let settingsKey in this.settings)
		{
			makeIPCEnumFunctions(this.pluginObj, this.name + "_settings_" + settingsKey, this.settings[settingsKey]);
		}
		for (let secretsKey in this.secrets)
		{
			makeIPCEnumFunctions(this.pluginObj, this.name + "_settings_" + secretsKey, this.secrets[secretsKey]);
		}

		//Create all the state.
		this.stateSchemas = {};
		this.pluginObj.state = {};
		for (let stateKey in config.state)
		{
			this.stateSchemas[stateKey] = config.state[stateKey];
			makeIPCEnumFunctions(this.pluginObj, this.name + "_state_" + stateKey, this.stateSchemas[stateKey]);
			this.pluginObj.state[stateKey] = constructDefaultSchema(config.state[stateKey]);
		}
		reactify(this.pluginObj.state);
	}

	async init(settings, secrets, actions, profiles, webServices, analytics, plugins)
	{
		let pluginSettings = settings.data[this.name] || {};
		let pluginSecrets = secrets.data[this.name] || {};

		this.pluginObj.settings = pluginSettings;
		this.pluginObj.secrets = pluginSecrets;
		this.pluginObj.webServices = webServices;
		this.pluginObj.actions = actions;
		this.pluginObj.profiles = profiles;
		this.pluginObj.plugins = plugins;
		this.pluginObj.analytics = analytics;

		if (this.initFunc)
		{
			try
			{
				await this.initFunc();
			} catch (err)
			{
				// TODO: Throw exception to UI
				logger.error(`Error loading ${this.name} plugin. Error Msg: ${err}.`)
			}
		}
	}

	setupTriggers(config) {
		for (let triggerName in config.triggers)
		{
			const triggerSpec = config.triggers[triggerName];

			const triggerObj = {
				name: triggerSpec.name,
				description: triggerSpec.description || "",
				context: triggerSpec.context || { },
			}

			if (triggerSpec.config)
			{
				triggerObj.config = triggerSpec.config;
				triggerObj.internalHandler = triggerSpec.handler.bind(this.pluginObj);
			}
			
			this.triggers[triggerName] = triggerObj;

			const triggerFunc = function (context, ...args) {
				return this.actions.trigger(this.name, triggerName, context || {}, args)
			}
			this.pluginObj.triggers[triggerName] = triggerFunc.bind(this.pluginObj);
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

		const cleanStateSchemas = {};
		for (let stateName in this.stateSchemas)
		{
			cleanStateSchemas[stateName] = cleanSchemaForIPC(this.name + "_state_" + stateName, this.stateSchemas[stateName])
		}

		for (let actionKey in this.actions)
		{
			actions[actionKey] = {
				name: this.actions[actionKey].name,
				description: this.actions[actionKey].description,
				data: cleanSchemaForIPC(this.name + "_action_" + actionKey, this.actions[actionKey].data),
				color: this.actions[actionKey].color,
				icon: this.actions[actionKey].icon,
			}
		}

		let settings = {};

		//convert all types to strings
		for (let settingsKey in this.settings)
		{
			settings[settingsKey] = cleanSchemaForIPC(this.name + "_settings_" + settingsKey, this.settings[settingsKey]);
		}

		let secrets = {};

		//convert all types to strings
		for (let secretsKey in this.secrets)
		{
			secrets[secretsKey] = cleanSchemaForIPC(this.name + "_secrets_" + secretsKey, this.secrets[secretsKey]);
		}

		//triggers

		let triggers = {};

		for (let triggerName in this.triggers)
		{
			triggers[triggerName] = { ...this.triggers[triggerName] }

			if (triggers[triggerName].config)
			{
				triggers[triggerName].config = cleanSchemaForIPC(this.name + "_triggers_config_" + triggerName, triggers[triggerName].config);
			}

			const contextSchema = cleanSchemaForIPC(this.name + "_triggers_context_" + triggerName, {
				type: Object,
				properties: triggers[triggerName].context || {}
			});

			triggers[triggerName].context = contextSchema.properties;


			delete triggers[triggerName].internalHandler
			delete triggers[triggerName].handler
		}

		return {
			name: this.name,
			uiName: this.uiName,
			icon: this.icon,
			color: this.color,
			settings,
			secrets,
			triggers,
			actions,
			stateSchemas: cleanStateSchemas,
			ipcMethods: Object.keys(this.ipcMethods),
			...this.settingsView ? { settingsView: this.settingsView } : {}
		}
	}

}

module.exports = {
	Plugin
}